-- V21__add_lat_lon_to_deliveries.sql
ALTER TABLE deliveries
ADD COLUMN latitude DOUBLE PRECISION,
ADD COLUMN longitude DOUBLE PRECISION;
