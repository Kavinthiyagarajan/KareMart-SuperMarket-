-- V20__create_delivery_clusters.sql
-- Delivery clustering tables
CREATE TABLE delivery_clusters (
    id BIGSERIAL PRIMARY KEY,
    cluster_code VARCHAR(20) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    estimated_distance DOUBLE PRECISION,
    estimated_duration INTERVAL,
    estimated_cost DOUBLE PRECISION,
    estimated_revenue DOUBLE PRECISION,
    estimated_profit DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE delivery_cluster_items (
    id BIGSERIAL PRIMARY KEY,
    cluster_id BIGINT NOT NULL REFERENCES delivery_clusters(id) ON DELETE CASCADE,
    delivery_id BIGINT NOT NULL REFERENCES deliveries(id) ON DELETE RESTRICT,
    sequence_number INT NOT NULL,
    CONSTRAINT uq_delivery_unique_active UNIQUE (delivery_id)
);

-- Indexes for performance
CREATE INDEX idx_delivery_cluster_items_cluster_id ON delivery_cluster_items(cluster_id);
CREATE INDEX idx_delivery_cluster_items_delivery_id ON delivery_cluster_items(delivery_id);
