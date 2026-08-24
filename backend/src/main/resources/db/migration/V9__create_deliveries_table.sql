CREATE TABLE deliveries (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL UNIQUE,
    provider VARCHAR(255) NOT NULL,
    provider_delivery_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    tracking_url VARCHAR(1024),
    estimated_delivery_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_delivery_order FOREIGN KEY (order_number) REFERENCES orders (order_number) ON DELETE CASCADE
);

CREATE INDEX idx_deliveries_order_number ON deliveries(order_number);
