CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description TEXT,
    amount DECIMAL(10, 2) NOT NULL,
    payer_id INT REFERENCES users(id),
    group_id INT REFERENCES groups(id),
    split_type VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS balances (
    user_id INT REFERENCES users(id),
    owes_to INT REFERENCES users(id),
    amount DECIMAL(10, 2) DEFAULT 0,
    PRIMARY KEY (user_id, owes_to)
);