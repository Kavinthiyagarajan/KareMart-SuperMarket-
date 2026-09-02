-- V22__fix_estimated_duration_type.sql
ALTER TABLE delivery_clusters
DROP COLUMN estimated_duration,
ADD COLUMN estimated_duration BIGINT;
