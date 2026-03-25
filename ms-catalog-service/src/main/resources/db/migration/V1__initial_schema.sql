-- V1__initial_schema.sql
-- Catalog Service Database Schema

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_products_name (name),
    INDEX idx_products_stock (stock_quantity)
);

-- Initial data
INSERT INTO products (name, description, price, stock_quantity) VALUES
('Laptop Pro', 'High-performance laptop', 1299.99, 50),
('Wireless Mouse', 'Ergonomic wireless mouse', 49.99, 200),
('Keyboard Mechanical', 'RGB mechanical keyboard', 149.99, 100),
('Monitor 27"', '4K IPS monitor', 349.99, 75),
('Headphones', 'Noise cancelling', 199.99, 150),
('Webcam HD', '1080p webcam', 89.99, 80);
