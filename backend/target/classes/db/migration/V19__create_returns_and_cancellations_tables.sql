CREATE TABLE cancellation_requests (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,
    refund_status VARCHAR(50) NOT NULL DEFAULT 'NOT_REQUESTED',
    refund_amount NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

CREATE INDEX idx_cancellation_requests_order_number ON cancellation_requests(order_number);
CREATE INDEX idx_cancellation_requests_user_id ON cancellation_requests(user_id);
CREATE INDEX idx_cancellation_requests_status ON cancellation_requests(status);
CREATE INDEX idx_cancellation_requests_created_at ON cancellation_requests(created_at);

CREATE TABLE return_requests (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(50) NOT NULL,
    refund_status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
    refund_amount NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

CREATE INDEX idx_return_requests_order_number ON return_requests(order_number);
CREATE INDEX idx_return_requests_user_id ON return_requests(user_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
CREATE INDEX idx_return_requests_created_at ON return_requests(created_at);
