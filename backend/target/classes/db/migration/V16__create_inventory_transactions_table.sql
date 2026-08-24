CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(id),
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    resulting_stock INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    reason VARCHAR(255),
    order_number VARCHAR(100),
    actor_username VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inv_txn_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inv_txn_created_at ON inventory_transactions(created_at);
CREATE INDEX idx_inv_txn_order_number ON inventory_transactions(order_number);
CREATE INDEX idx_inv_txn_type ON inventory_transactions(transaction_type);
