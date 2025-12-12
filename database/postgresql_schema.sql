-- ============================================================================
-- PharmaCare PostgreSQL Database Schema
-- ============================================================================
-- This file contains the PostgreSQL version of the database schema
-- Run this in your PostgreSQL database (psql, pgAdmin, or Render dashboard)
-- ============================================================================

-- Create database (run this separately if needed)
-- CREATE DATABASE pharmacare;
-- \c pharmacare;

-- ============================================================================
-- 1. PHARMACY TABLE (Main company/chain)
-- ============================================================================
CREATE TABLE IF NOT EXISTS pharmacy (
    pharmacy_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pharmacy_name ON pharmacy(name);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================================
-- 2. ROLE TABLE (User roles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS role (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_role_name ON role(role_name);

-- ============================================================================
-- 3. BRANCH TABLE (Individual pharmacy outlets)
-- Note: created_by foreign key will be added after user table is created
-- ============================================================================
CREATE TABLE IF NOT EXISTS branch (
    branch_id SERIAL PRIMARY KEY,
    pharmacy_id INTEGER NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_by INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacy(pharmacy_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_branch_pharmacy_id ON branch(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_branch_name ON branch(branch_name);
CREATE INDEX IF NOT EXISTS idx_branch_created_by ON branch(created_by);

-- ============================================================================
-- 4. USER TABLE (Employee accounts - for authentication)
-- ============================================================================
CREATE TABLE IF NOT EXISTS "user" (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER NOT NULL,
    branch_id INTEGER NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_temporary_password BOOLEAN DEFAULT FALSE,
    password_changed_at TIMESTAMP NULL,
    must_change_password BOOLEAN DEFAULT FALSE,
    verification_code VARCHAR(6) NULL,
    verification_code_expires TIMESTAMP NULL,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    created_by INTEGER NULL,
    FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES "user"(user_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_role_id ON "user"(role_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_id ON "user"(branch_id);
CREATE INDEX IF NOT EXISTS idx_user_created_by ON "user"(created_by);
CREATE INDEX IF NOT EXISTS idx_user_verification_code ON "user"(verification_code);
CREATE INDEX IF NOT EXISTS idx_user_is_email_verified ON "user"(is_email_verified);
CREATE INDEX IF NOT EXISTS idx_user_is_active ON "user"(is_active);

-- ============================================================================
-- 5. CATEGORY TABLE (Medicine categories)
-- ============================================================================
CREATE TABLE IF NOT EXISTS category (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_category_name ON category(category_name);

-- ============================================================================
-- 6. MEDICINE TABLE (Medicine inventory per branch)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicine (
    medicine_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    quantity_in_stock INTEGER DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    expiry_date DATE,
    barcode VARCHAR(100),
    manufacturer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_medicine_branch_id ON medicine(branch_id);
CREATE INDEX IF NOT EXISTS idx_medicine_category_id ON medicine(category_id);
CREATE INDEX IF NOT EXISTS idx_medicine_name ON medicine(name);
CREATE INDEX IF NOT EXISTS idx_medicine_expiry_date ON medicine(expiry_date);

-- ============================================================================
-- 7. SALE TABLE (Sales transactions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sale (
    sale_id SERIAL PRIMARY KEY,
    branch_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sale_branch_id ON sale(branch_id);
CREATE INDEX IF NOT EXISTS idx_sale_user_id ON sale(user_id);
CREATE INDEX IF NOT EXISTS idx_sale_date ON sale(sale_date);

-- ============================================================================
-- 8. SALE ITEM TABLE (Individual items in each sale)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sale_item (
    sale_item_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_sale_item_sale_id ON sale_item(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_item_medicine_id ON sale_item(medicine_id);

-- ============================================================================
-- 9. PAYMENT TABLE (Payment methods for sales)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment (
    payment_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_sale_id ON payment(sale_id);
CREATE INDEX IF NOT EXISTS idx_payment_type ON payment(payment_type);

-- ============================================================================
-- 10. RETURN TABLE (Returned medicines)
-- ============================================================================
CREATE TABLE IF NOT EXISTS return_table (
    return_id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL,
    medicine_id INTEGER NOT NULL,
    quantity_returned INTEGER NOT NULL,
    return_reason TEXT,
    return_condition VARCHAR(100),
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE RESTRICT,
    FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_return_sale_id ON return_table(sale_id);
CREATE INDEX IF NOT EXISTS idx_return_medicine_id ON return_table(medicine_id);
CREATE INDEX IF NOT EXISTS idx_return_status ON return_table(status);

-- ============================================================================
-- 11. REFUND TABLE (Refunds for returns)
-- ============================================================================
CREATE TABLE IF NOT EXISTS refund (
    refund_id SERIAL PRIMARY KEY,
    return_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_method VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (return_id) REFERENCES return_table(return_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_refund_return_id ON refund(return_id);
CREATE INDEX IF NOT EXISTS idx_refund_user_id ON refund(user_id);

-- ============================================================================
-- 12. NOTIFICATION TABLE (System alerts and reminders)
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

-- ============================================================================
-- 13. PASSWORD RESET TABLE (Password reset requests and tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS password_reset (
    reset_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    reset_token VARCHAR(255) NOT NULL UNIQUE,
    temporary_password VARCHAR(255) NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_token ON password_reset(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_used_at ON password_reset(used_at);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS THAT DEPEND ON USER TABLE
-- ============================================================================
-- Add foreign key from branch to user (created_by)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'branch_created_by_fkey'
    ) THEN
        ALTER TABLE branch 
        ADD CONSTRAINT branch_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES "user"(user_id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE TRIGGER update_pharmacy_updated_at BEFORE UPDATE ON pharmacy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_role_updated_at BEFORE UPDATE ON role
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_updated_at BEFORE UPDATE ON branch
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "user"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_updated_at BEFORE UPDATE ON category
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medicine_updated_at BEFORE UPDATE ON medicine
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sale_updated_at BEFORE UPDATE ON sale
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT DEFAULT DATA
-- ============================================================================

-- Insert default roles
INSERT INTO role (role_name, description) VALUES
('Admin', 'System-level access across all branches (not a pharmacy role)'),
('Manager', 'Branch-level management and oversight'),
('Pharmacist', 'Medicine stock management and dispensing'),
('Cashier', 'Sales transactions only')
ON CONFLICT (role_name) DO UPDATE SET role_name = EXCLUDED.role_name;

-- Insert sample pharmacy
INSERT INTO pharmacy (name, address, phone, email) VALUES
('PharmaCare PLC', 'Addis Ababa, Ethiopia', '+251-11-123-4567', 'info@pharmacare.et')
ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO category (category_name, description) VALUES
('Antibiotics', 'Antibacterial medications'),
('Painkillers', 'Pain relief medications'),
('Vitamins', 'Vitamin supplements'),
('Antacids', 'Stomach and digestive medications'),
('Cough & Cold', 'Cold and flu medications')
ON CONFLICT (category_name) DO UPDATE SET category_name = EXCLUDED.category_name;

-- ============================================================================
-- CREATE ADMIN ACCOUNT
-- ============================================================================
-- Admin credentials:
-- Email: admin@pharmacare.com
-- Password: Admin@123
-- Password hash: $2a$10$6Sk6u5Z9oatv4NDhC9cDhe6JzoJPK.qdG1UDgpn9DI9HKtkAAqr.W

DO $$
DECLARE
    admin_role_id INTEGER;
BEGIN
    -- Get Admin role_id
    SELECT role_id INTO admin_role_id FROM role WHERE role_name = 'Admin' LIMIT 1;
    
    -- Create Admin user
    INSERT INTO "user" (
        full_name,
        email,
        password,
        role_id,
        branch_id,
        is_active,
        is_email_verified,
        must_change_password
    ) VALUES (
        'System Administrator',
        'admin@pharmacare.com',
        '$2a$10$6Sk6u5Z9oatv4NDhC9cDhe6JzoJPK.qdG1UDgpn9DI9HKtkAAqr.W',
        admin_role_id,
        NULL,
        TRUE,
        TRUE,
        FALSE
    )
    ON CONFLICT (email) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        password = EXCLUDED.password,
        is_active = EXCLUDED.is_active,
        is_email_verified = EXCLUDED.is_email_verified;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all tables were created
SELECT 'Tables created successfully' as status;

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check roles
SELECT 'Roles:' as info;
SELECT * FROM role;

-- Check pharmacy
SELECT 'Pharmacy:' as info;
SELECT * FROM pharmacy;

-- Check admin account
SELECT 'Admin Account:' as info;
SELECT 
    u.user_id,
    u.full_name,
    u.email,
    u.is_active,
    r.role_name as role
FROM "user" u
LEFT JOIN role r ON u.role_id = r.role_id
WHERE u.email = 'admin@pharmacare.com';

-- Check categories
SELECT 'Categories:' as info;
SELECT * FROM category;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Your PostgreSQL database is now ready to use!
-- 
-- Admin Login:
-- Email: admin@pharmacare.com
-- Password: Admin@123
--
-- Next Steps:
-- 1. Update backend/.env with your PostgreSQL connection settings
-- 2. Install dependencies: npm install (pg package)
-- 3. Start your backend server: npm start
-- 4. Test admin login in Postman
-- ============================================================================

