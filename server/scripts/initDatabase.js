import { pool } from "../config/database.js"

const createTables = async () => {
  try {
    // Create tenants table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tenants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        emergency_contact VARCHAR(255),
        emergency_phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create units table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        unit_number VARCHAR(50) UNIQUE NOT NULL,
        type ENUM('studio', 'one_bedroom', 'two_bedroom', 'three_bedroom', 'house') NOT NULL,
        rent_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('vacant', 'occupied', 'maintenance') DEFAULT 'vacant',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `)

    // Create leases table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS leases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        unit_id INT NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        rent_amount DECIMAL(10, 2) NOT NULL,
        security_deposit DECIMAL(10, 2),
        lease_terms TEXT,
        status ENUM('active', 'expired', 'terminated') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      )
    `)

    // Create payments table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        lease_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method ENUM('cash', 'check', 'bank_transfer', 'credit_card') NOT NULL,
        payment_type ENUM('rent', 'deposit', 'late_fee', 'maintenance', 'other') DEFAULT 'rent',
        description TEXT,
        status ENUM('pending', 'completed', 'failed') DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        FOREIGN KEY (lease_id) REFERENCES leases(id) ON DELETE SET NULL
      )
    `)

    console.log("✅ All tables created successfully")

    // Insert sample data
    await insertSampleData()
  } catch (error) {
    console.error("❌ Error creating tables:", error)
  }
}

const insertSampleData = async () => {
  try {
    // Sample tenants
    await pool.execute(`
      INSERT IGNORE INTO tenants (name, email, phone, address, emergency_contact, emergency_phone) VALUES
      ('John Doe', 'john.doe@email.com', '555-0101', '123 Main St', 'Jane Doe', '555-0102'),
      ('Alice Smith', 'alice.smith@email.com', '555-0201', '456 Oak Ave', 'Bob Smith', '555-0202'),
      ('Mike Johnson', 'mike.johnson@email.com', '555-0301', '789 Pine Rd', 'Sarah Johnson', '555-0302')
    `)

    // Sample units
    await pool.execute(`
      INSERT IGNORE INTO units (unit_number, type, rent_amount, status, description) VALUES
      ('A101', 'one_bedroom', 1200.00, 'occupied', 'Modern 1BR with balcony'),
      ('A102', 'one_bedroom', 1200.00, 'vacant', 'Renovated 1BR unit'),
      ('B201', 'two_bedroom', 1800.00, 'occupied', 'Spacious 2BR with city view'),
      ('B202', 'two_bedroom', 1800.00, 'vacant', '2BR with updated kitchen'),
      ('C301', 'studio', 900.00, 'maintenance', 'Cozy studio apartment')
    `)

    // Sample leases
    await pool.execute(`
      INSERT IGNORE INTO leases (tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms, status) VALUES
      (1, 1, '2024-01-01', '2024-12-31', 1200.00, 1200.00, '12-month lease agreement', 'active'),
      (3, 3, '2024-02-01', '2025-01-31', 1800.00, 1800.00, '12-month lease agreement', 'active')
    `)

    // Sample payments
    await pool.execute(`
      INSERT IGNORE INTO payments (tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description) VALUES
      (1, 1, 1200.00, '2024-01-01', 'bank_transfer', 'rent', 'January rent payment'),
      (1, 1, 1200.00, '2024-02-01', 'bank_transfer', 'rent', 'February rent payment'),
      (3, 2, 1800.00, '2024-02-01', 'check', 'rent', 'February rent payment'),
      (3, 2, 1800.00, '2024-03-01', 'check', 'rent', 'March rent payment')
    `)

    console.log("✅ Sample data inserted successfully")
  } catch (error) {
    console.error("❌ Error inserting sample data:", error)
  }
}

createTables()
