CREATE TABLE support_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    request_type VARCHAR(50) NOT NULL,
    product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE support_messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id BIGINT NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(50) NOT NULL,
    sender_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    availability_status VARCHAR(50),
    available_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_support_conv_user_id ON support_conversations(user_id);
CREATE INDEX idx_support_conv_status ON support_conversations(status);
CREATE INDEX idx_support_conv_created_at ON support_conversations(created_at);
CREATE INDEX idx_support_conv_product_id ON support_conversations(product_id);
CREATE INDEX idx_support_msg_conv_id ON support_messages(conversation_id);
CREATE INDEX idx_support_msg_created_at ON support_messages(created_at);
