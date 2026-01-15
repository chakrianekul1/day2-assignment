CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    stock_count INT DEFAULT 0
);

CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT REFERENCES items(id),
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' -- [cite: 16]
);

INSERT INTO items (name, stock_count) VALUES ('Laptop', 0), ('Phone', 0);