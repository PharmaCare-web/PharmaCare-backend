-- Check user email verification status
-- Run this in phpMyAdmin to see verification status

USE pharmacare;

-- View all users with verification status
SELECT 
    user_id,
    full_name,
    email,
    CASE 
        WHEN is_email_verified IS NULL THEN 'Not Configured'
        WHEN is_email_verified = 1 OR is_email_verified = TRUE THEN 'Verified'
        WHEN is_email_verified = 0 OR is_email_verified = FALSE THEN 'Unverified'
        ELSE 'Unknown'
    END AS verification_status,
    verification_code,
    verification_code_expires,
    created_at
FROM user
ORDER BY user_id DESC;

-- View only unverified users
SELECT 
    user_id,
    full_name,
    email,
    'Unverified' AS status,
    verification_code,
    verification_code_expires,
    created_at
FROM user
WHERE is_email_verified = 0 OR is_email_verified IS NULL OR is_email_verified = FALSE
ORDER BY created_at DESC;

-- View only verified users
SELECT 
    user_id,
    full_name,
    email,
    'Verified' AS status,
    created_at
FROM user
WHERE is_email_verified = 1 OR is_email_verified = TRUE
ORDER BY created_at DESC;

