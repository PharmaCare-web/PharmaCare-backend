-- Add last_login column to user table
-- Run this in phpMyAdmin or MySQL command line

USE pharmacare;

-- Add last_login column if it doesn't exist
ALTER TABLE user ADD COLUMN last_login TIMESTAMP NULL;

-- Note: If you get "Duplicate column name" error, the column already exists - that's fine!

