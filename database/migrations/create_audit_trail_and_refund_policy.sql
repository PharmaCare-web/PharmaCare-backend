-- ============================================================================
-- Migration: Create audit_trail and refund_policy tables
-- ============================================================================
-- This migration creates the audit_trail table for tracking all system actions
-- and the refund_policy table for managing branch refund policies
-- ============================================================================

-- ============================================================================
-- AUDIT TRAIL TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'payment', 'refund', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'sale', 'medicine', 'user', 'branch', 'refund', etc.
    entity_id INTEGER NULL, -- ID of the affected entity
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_audit_trail_branch_id ON audit_trail(branch_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created_at ON audit_trail(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_id ON audit_trail(entity_id);

-- ============================================================================
-- REFUND POLICY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS refund_policy (
    policy_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL UNIQUE,
    refund_days_limit INTEGER DEFAULT 30, -- Number of days after sale for refund eligibility
    refund_conditions TEXT, -- Conditions for refund (e.g., "Items must be unopened")
    requires_receipt BOOLEAN DEFAULT TRUE, -- Whether receipt is required for refund
    refund_methods VARCHAR(255) DEFAULT 'original_payment', -- Payment methods accepted for refund
    notes TEXT, -- Additional notes about the refund policy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refund_policy_branch_id ON refund_policy(branch_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_refund_policy_updated_at BEFORE UPDATE ON refund_policy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'Audit trail and refund policy tables created successfully' as status;

-- List the new tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('audit_trail', 'refund_policy')
ORDER BY table_name;
