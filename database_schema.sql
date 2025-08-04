-- Database Schema for Altar App
-- Run this in your MySQL database

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS virtual_wall_decor;
USE virtual_wall_decor;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP NULL
);

-- Walls table
CREATE TABLE IF NOT EXISTS walls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    wall_name VARCHAR(255),
    wall_data JSON NOT NULL,
    thumbnail_url VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Subscriptions table (if you have subscription features)
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_type ENUM('free', 'basic', 'premium') DEFAULT 'free',
    status ENUM('active', 'cancelled', 'expired') DEFAULT 'active',
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_walls_user_id ON walls(user_id);
CREATE INDEX idx_walls_created_at ON walls(created_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Insert default admin user (optional)
-- INSERT INTO users (email, password, first_name, last_name, is_active, email_verified) 
-- VALUES ('admin@example.com', '$2b$10$yourhashedpassword', 'Admin', 'User', TRUE, TRUE); 