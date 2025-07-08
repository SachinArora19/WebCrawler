-- Initialize webcrawler database with proper charset and collation
CREATE DATABASE IF NOT EXISTS webcrawler 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- Create webcrawler user with proper permissions
CREATE USER IF NOT EXISTS 'webcrawler'@'%' IDENTIFIED BY 'webcrawler123';
GRANT ALL PRIVILEGES ON webcrawler.* TO 'webcrawler'@'%';

-- Create a read-only user for monitoring/reporting
CREATE USER IF NOT EXISTS 'webcrawler_read'@'%' IDENTIFIED BY 'readonly123';
GRANT SELECT ON webcrawler.* TO 'webcrawler_read'@'%';

-- Flush privileges to ensure changes take effect
FLUSH PRIVILEGES;

-- Use the webcrawler database
USE webcrawler;

-- Create indexes for better performance (GORM will create tables)
-- These will be applied after GORM creates the tables

-- Set session variables for optimal performance
SET SESSION sql_mode = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION';

-- Optional: Create sample data for testing
-- This will be populated by the application
