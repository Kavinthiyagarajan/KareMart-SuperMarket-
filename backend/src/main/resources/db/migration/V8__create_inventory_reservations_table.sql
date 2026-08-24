CREATE TABLE inventory_reservations (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    status VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_res_order FOREIGN KEY (order_number) REFERENCES orders(order_number) ON DELETE CASCADE,
    CONSTRAINT fk_inv_res_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX idx_inv_res_order_number ON inventory_reservations(order_number);
CREATE INDEX idx_inv_res_status_expires_at ON inventory_reservations(status, expires_at);
