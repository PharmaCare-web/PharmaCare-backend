-- Add email verification fields to user table
-- Run this script in your MySQL database (phpMyAdmin or MySQL command line)
USE pharmacare;

-- Add verification_code column (ignore error if column already exists)
ALTER TABLE user ADD COLUMN verification_code VARCHAR(6) NULL;
CREATE INDEX IF NOT EXISTS idx_verification_code ON user(verification_code);

-- Add is_email_verified column (ignore error if column already exists)
ALTER TABLE user ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_is_email_verified ON user(is_email_verified);

-- Add verification_code_expires column (ignore error if column already exists)
ALTER TABLE user ADD COLUMN verification_code_expires TIMESTAMP NULL;

-- Note: If you get "Duplicate column name" errors, the columns already exist - that's fine!

