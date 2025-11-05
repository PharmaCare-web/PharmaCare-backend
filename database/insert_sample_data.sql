-- Insert sample data for PharmaCare
USE pharmacare;

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

-- Insert sample branches (assuming pharmacy_id = 1)
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

SELECT 'Sample data inserted successfully!' as status;




