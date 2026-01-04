-- ============================================================================
-- Create Notification Table
-- ============================================================================
-- Run this script in your PostgreSQL database to create the notification table
-- if it doesn't exist. This is required for the payment request notifications.
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification (
    notification_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notification_branch_id ON notification(branch_id);
CREATE INDEX IF NOT EXISTS idx_notification_is_read ON notification(is_read);
CREATE INDEX IF NOT EXISTS idx_notification_type ON notification(type);

-- Verify table was created
SELECT 'Notification table created successfully!' as status;

