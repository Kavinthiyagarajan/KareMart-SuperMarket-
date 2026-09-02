-- V23__fix_estimated_duration_type_numeric.sql
ALTER TABLE delivery_clusters
ALTER COLUMN estimated_duration TYPE NUMERIC(21,0);
