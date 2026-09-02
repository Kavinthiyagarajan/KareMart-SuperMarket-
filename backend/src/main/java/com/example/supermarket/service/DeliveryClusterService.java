package com.example.supermarket.service;

import com.example.supermarket.model.Delivery;
import com.example.supermarket.model.DeliveryCluster;
import com.example.supermarket.model.DeliveryClusterItem;
import com.example.supermarket.repository.DeliveryClusterItemRepository;
import com.example.supermarket.repository.DeliveryClusterRepository;
import com.example.supermarket.repository.DeliveryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DeliveryClusterService {

    private final DeliveryRepository deliveryRepository;
    private final DeliveryClusterRepository clusterRepository;
    private final DeliveryClusterItemRepository itemRepository;

    @Value("${delivery.clustering.max-distance-km:2}")
    private double maxDistanceKm;

    @Value("${delivery.clustering.max-orders:5}")
    private int maxOrdersPerCluster;

    @Value("${delivery.cost-per-km:1.5}")
    private double costPerKm;

    @Value("${delivery.fixed-trip-cost:20}")
    private double fixedTripCost;

    @Value("${delivery.hub.latitude:0.0}")
    private double hubLatitude;

    @Value("${delivery.hub.longitude:0.0}")
    private double hubLongitude;

    public DeliveryClusterService(DeliveryRepository deliveryRepository,
                                 DeliveryClusterRepository clusterRepository,
                                 DeliveryClusterItemRepository itemRepository) {
        this.deliveryRepository = deliveryRepository;
        this.clusterRepository = clusterRepository;
        this.itemRepository = itemRepository;
    }

    /**
     * Generate clusters for eligible deliveries.
     */
    @Transactional
    public List<DeliveryCluster> generateClusters() {
        // Step 1: fetch eligible deliveries (not already assigned, not completed/cancelled)
        List<Delivery> eligible = deliveryRepository.findAll().stream()
                .filter(d -> d.getStatus() == com.example.supermarket.model.DeliveryStatus.CREATED
                        || d.getStatus() == com.example.supermarket.model.DeliveryStatus.ASSIGNED)
                .filter(d -> d.getLatitude() != null && d.getLongitude() != null)
                .filter(d -> !itemRepository.existsByDeliveryId(d.getId()))
                .collect(Collectors.toList());

        List<DeliveryCluster> createdClusters = new ArrayList<>();
        // Simple distance‑threshold clustering
        while (!eligible.isEmpty()) {
            Delivery seed = eligible.remove(0);
            List<Delivery> clusterMembers = new ArrayList<>();
            clusterMembers.add(seed);
            // Find nearby deliveries within maxDistanceKm
            eligible.removeIf(d -> {
                if (clusterMembers.size() >= maxOrdersPerCluster) return true; // limit reached
                double dist = haversine(seed.getLatitude(), seed.getLongitude(), d.getLatitude(), d.getLongitude());
                if (dist <= maxDistanceKm) {
                    clusterMembers.add(d);
                    return true; // remove from eligible list
                }
                return false;
            });
            // Order route using nearest‑neighbor from hub
            List<Delivery> ordered = orderRoute(clusterMembers);
            // Persist cluster
            DeliveryCluster cluster = new DeliveryCluster();
            cluster.setClusterCode("CL-" + Instant.now().toEpochMilli());
            cluster.setStatus("DRAFT");
            // Estimate metrics
            double totalDist = computeTotalDistance(ordered);
            cluster.setEstimatedDistance(totalDist);
            cluster.setEstimatedDuration(Duration.ofMinutes((long) (totalDist / 0.5 * 60))); // assume 0.5 km/min avg speed
            double estCost = fixedTripCost + totalDist * costPerKm;
            cluster.setEstimatedCost(estCost);
            // Revenue: naive sum of a placeholder delivery fee (not stored, use 0 for now)
            cluster.setEstimatedRevenue(0.0);
            cluster.setEstimatedProfit(cluster.getEstimatedRevenue() - estCost);
            cluster = clusterRepository.save(cluster);
            // Save items with sequence numbers
            int seq = 1;
            for (Delivery del : ordered) {
                DeliveryClusterItem item = new DeliveryClusterItem();
                item.setCluster(cluster);
                item.setDelivery(del);
                item.setSequenceNumber(seq++);
                itemRepository.save(item);
            }
            createdClusters.add(cluster);
        }
        return createdClusters;
    }

    /** Haversine distance in kilometers */
    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /** Simple nearest‑neighbor route ordering starting from hub */
    private List<Delivery> orderRoute(List<Delivery> deliveries) {
        List<Delivery> remaining = new ArrayList<>(deliveries);
        List<Delivery> route = new ArrayList<>();
        double curLat = hubLatitude;
        double curLon = hubLongitude;
        while (!remaining.isEmpty()) {
            final double finalCurLat = curLat;
            final double finalCurLon = curLon;
            Delivery next = Collections.min(remaining, (d1, d2) ->
                    Double.compare(haversine(finalCurLat, finalCurLon, d1.getLatitude(), d1.getLongitude()),
                                   haversine(finalCurLat, finalCurLon, d2.getLatitude(), d2.getLongitude())));
            route.add(next);
            curLat = next.getLatitude();
            curLon = next.getLongitude();
            remaining.remove(next);
        }
        return route;
    }

    /** Compute total distance of the route (hub -> deliveries -> hub) */
    private double computeTotalDistance(List<Delivery> ordered) {
        double distance = 0.0;
        double prevLat = hubLatitude;
        double prevLon = hubLongitude;
        for (Delivery d : ordered) {
            distance += haversine(prevLat, prevLon, d.getLatitude(), d.getLongitude());
            prevLat = d.getLatitude();
            prevLon = d.getLongitude();
        }
        // Return to hub
        distance += haversine(prevLat, prevLon, hubLatitude, hubLongitude);
        return distance;
    }
    public List<DeliveryCluster> getAllClusters() {
        return clusterRepository.findAll();
    }

    public Optional<DeliveryCluster> getClusterById(Long id) {
        return clusterRepository.findById(id);
    }

    public Optional<DeliveryCluster> updateClusterStatus(Long id, String newStatus) {
        Optional<DeliveryCluster> opt = clusterRepository.findById(id);
        if (opt.isPresent()) {
            DeliveryCluster cluster = opt.get();
            cluster.setStatus(newStatus);
            clusterRepository.save(cluster);
            return Optional.of(cluster);
        }
        return Optional.empty();
    }

    public boolean addDeliveryToCluster(Long clusterId, Long deliveryId) {
        Optional<DeliveryCluster> optCluster = clusterRepository.findById(clusterId);
        Optional<Delivery> optDelivery = deliveryRepository.findById(deliveryId);
        if (optCluster.isEmpty() || optDelivery.isEmpty()) {
            return false;
        }
        // prevent duplicate assignment
        if (itemRepository.existsByDeliveryId(deliveryId)) {
            return false;
        }
        // enforce max orders per cluster
        long currentCount = itemRepository.countByClusterId(clusterId);
        if (currentCount >= maxOrdersPerCluster) {
            return false;
        }
        DeliveryCluster cluster = optCluster.get();
        int nextSeq = (int) (currentCount + 1);
        DeliveryClusterItem item = new DeliveryClusterItem();
        item.setCluster(cluster);
        item.setDelivery(optDelivery.get());
        item.setSequenceNumber(nextSeq);
        itemRepository.save(item);
        return true;
    }

    public boolean removeDeliveryFromCluster(Long clusterId, Long deliveryId) {
        Optional<DeliveryClusterItem> optItem = itemRepository.findByClusterIdAndDeliveryId(clusterId, deliveryId);
        if (optItem.isPresent()) {
            itemRepository.delete(optItem.get());
            return true;
        }
        return false;
    }

    }
