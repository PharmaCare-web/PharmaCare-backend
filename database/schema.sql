-- PharmaCare Database Schema
-- Database: pharmacare

CREATE DATABASE IF NOT EXISTS pharmacare;
USE pharmacare;

-- 1. Pharmacy Table (Main company/chain)
CREATE TABLE IF NOT EXISTS pharmacy (
    pharmacy_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Branch Table (Individual pharmacy outlets)
CREATE TABLE IF NOT EXISTS branch (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    pharmacy_id INT NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pharmacy_id) REFERENCES pharmacy(pharmacy_id) ON DELETE CASCADE,
    INDEX idx_pharmacy_id (pharmacy_id),
    INDEX idx_branch_name (branch_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Role Table (User roles: Admin, Manager, Pharmacist, Cashier)
CREATE TABLE IF NOT EXISTS role (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. User Table (Employee accounts - for authentication)
CREATE TABLE IF NOT EXISTS user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    branch_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_role_id (role_id),
    INDEX idx_branch_id (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Category Table (Medicine categories)
CREATE TABLE IF NOT EXISTS category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Medicine Table (Medicine inventory per branch)
CREATE TABLE IF NOT EXISTS medicine (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    quantity_in_stock INT DEFAULT 0,
    price DECIMAL(10, 2) NOT NULL,
    expiry_date DATE,
    barcode VARCHAR(100),
    manufacturer VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE RESTRICT,
    INDEX idx_branch_id (branch_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name),
    INDEX idx_expiry_date (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Sale Table (Sales transactions)
CREATE TABLE IF NOT EXISTS sale (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    user_id INT NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE RESTRICT,
    INDEX idx_branch_id (branch_id),
    INDEX idx_user_id (user_id),
    INDEX idx_sale_date (sale_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Sale Item Table (Individual items in each sale)
CREATE TABLE IF NOT EXISTS sale_item (
    sale_item_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id) ON DELETE RESTRICT,
    INDEX idx_sale_id (sale_id),
    INDEX idx_medicine_id (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Payment Table (Payment methods for sales)
CREATE TABLE IF NOT EXISTS payment (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    payment_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE CASCADE,
    INDEX idx_sale_id (sale_id),
    INDEX idx_payment_type (payment_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Return Table (Returned medicines)
CREATE TABLE IF NOT EXISTS return_table (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    medicine_id INT NOT NULL,
    quantity_returned INT NOT NULL,
    return_reason TEXT,
    return_condition VARCHAR(100),
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    FOREIGN KEY (sale_id) REFERENCES sale(sale_id) ON DELETE RESTRICT,
    FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id) ON DELETE RESTRICT,
    INDEX idx_sale_id (sale_id),
    INDEX idx_medicine_id (medicine_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Refund Table (Refunds for returns)
CREATE TABLE IF NOT EXISTS refund (
    refund_id INT AUTO_INCREMENT PRIMARY KEY,
    return_id INT NOT NULL,
    user_id INT NOT NULL,
    refund_amount DECIMAL(10, 2) NOT NULL,
    refund_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    refund_method VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (return_id) REFERENCES return_table(return_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE RESTRICT,
    INDEX idx_return_id (return_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Notification Table (System alerts and reminders)
CREATE TABLE IF NOT EXISTS notification (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
    INDEX idx_branch_id (branch_id),
    INDEX idx_is_read (is_read),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default roles
INSERT INTO role (role_name, description) VALUES
('Admin', 'Full system access across all branches'),
('Manager', 'Branch-level management and oversight'),
('Pharmacist', 'Medicine stock management and dispensing'),
('Cashier', 'Sales transactions only')
ON DUPLICATE KEY UPDATE role_name=role_name;

-- Insert sample pharmacy
INSERT INTO pharmacy (name, address, phone, email) VALUES
('PharmaCare PLC', 'Addis Ababa, Ethiopia', '+251-11-123-4567', 'info@pharmacare.et')
ON DUPLICATE KEY UPDATE name=name;

-- Insert sample branch (assuming pharmacy_id = 1)
INSERT INTO branch (pharmacy_id, branch_name, location, email, phone) VALUES
(1, 'PharmaCare - Addis Ababa Branch', 'Addis Ababa, Bole', 'addis@pharmacare.et', '+251-11-123-4568'),
(1, 'PharmaCare - Debre Berhan Branch', 'Debre Berhan', 'debreberhan@pharmacare.et', '+251-11-123-4569')
ON DUPLICATE KEY UPDATE branch_name=branch_name;

-- Insert sample categories
INSERT INTO category (category_name, description) VALUES
('Antibiotics', 'Antibacterial medications'),
('Painkillers', 'Pain relief medications'),
('Vitamins', 'Vitamin supplements'),
('Antacids', 'Stomach and digestive medications'),
('Cough & Cold', 'Cold and flu medications')
ON DUPLICATE KEY UPDATE category_name=category_name;

