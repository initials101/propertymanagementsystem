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

    // Create payments table with mobile_money included
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tenant_id INT NOT NULL,
        lease_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        payment_date DATE NOT NULL,
        payment_method ENUM('cash', 'check', 'bank_transfer', 'credit_card', 'mobile_money') NOT NULL,
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
    // Clear existing data first (optional - remove if you want to keep existing data)
    console.log("🧹 Clearing existing data...")
    await pool.execute("SET FOREIGN_KEY_CHECKS = 0")
    await pool.execute("TRUNCATE TABLE payments")
    await pool.execute("TRUNCATE TABLE leases")
    await pool.execute("TRUNCATE TABLE units")
    await pool.execute("TRUNCATE TABLE tenants")
    await pool.execute("SET FOREIGN_KEY_CHECKS = 1")

    // Sample tenants with Kenyan names and details
    await pool.execute(`
      INSERT INTO tenants (name, email, phone, address, emergency_contact, emergency_phone) VALUES
      ('John Kamau Mwangi', 'john.kamau@gmail.com', '+254712345678', 'Kileleshwa, Nairobi', 'Mary Kamau', '+254723456789'),
      ('Grace Wanjiku Njeri', 'grace.wanjiku@yahoo.com', '+254734567890', 'Westlands, Nairobi', 'Peter Njeri', '+254745678901'),
      ('Michael Otieno Ochieng', 'mike.otieno@gmail.com', '+254756789012', 'Karen, Nairobi', 'Sarah Otieno', '+254767890123'),
      ('Faith Akinyi Ouma', 'faith.akinyi@outlook.com', '+254778901234', 'Kilimani, Nairobi', 'James Ouma', '+254789012345'),
      ('David Kipchoge Ruto', 'david.kipchoge@gmail.com', '+254790123456', 'Lavington, Nairobi', 'Rose Ruto', '+254701234567'),
      ('Esther Nyambura Gitau', 'esther.nyambura@gmail.com', '+254712345679', 'Parklands, Nairobi', 'Samuel Gitau', '+254723456780'),
      ('Robert Maina Kariuki', 'robert.maina@yahoo.com', '+254734567891', 'South B, Nairobi', 'Jane Kariuki', '+254745678902'),
      ('Lucy Wangari Kimani', 'lucy.wangari@gmail.com', '+254756789013', 'South C, Nairobi', 'Joseph Kimani', '+254767890124')
    `)

    // Sample units with Kenyan rental prices (in KES)
    await pool.execute(`
      INSERT INTO units (unit_number, type, rent_amount, status, description) VALUES
      ('A101', 'one_bedroom', 28000.00, 'occupied', 'Modern 1BR apartment with balcony in Kileleshwa'),
      ('A102', 'one_bedroom', 28000.00, 'vacant', 'Newly renovated 1BR unit with modern fixtures'),
      ('A103', 'one_bedroom', 25000.00, 'occupied', 'Cozy 1BR apartment with garden view'),
      ('B201', 'two_bedroom', 45000.00, 'occupied', 'Spacious 2BR apartment with city view in Westlands'),
      ('B202', 'two_bedroom', 45000.00, 'vacant', '2BR unit with updated kitchen and parking'),
      ('B203', 'two_bedroom', 42000.00, 'maintenance', '2BR apartment undergoing renovation'),
      ('C301', 'studio', 18000.00, 'vacant', 'Compact studio apartment perfect for young professionals'),
      ('C302', 'studio', 20000.00, 'occupied', 'Modern studio with kitchenette in prime location'),
      ('D401', 'three_bedroom', 65000.00, 'occupied', 'Luxury 3BR apartment with master ensuite'),
      ('D402', 'three_bedroom', 60000.00, 'vacant', 'Spacious 3BR family apartment with balcony'),
      ('E501', 'house', 120000.00, 'occupied', '4BR standalone house with compound in Karen'),
      ('E502', 'house', 95000.00, 'vacant', '3BR bungalow with garden and parking')
    `)

    // Sample leases with realistic Kenyan terms
    await pool.execute(`
      INSERT INTO leases (tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms, status) VALUES
      (1, 1, '2024-01-01', '2024-12-31', 28000.00, 56000.00, '12-month lease agreement. Rent payable monthly in advance. Security deposit equivalent to 2 months rent.', 'active'),
      (3, 4, '2024-02-01', '2025-01-31', 45000.00, 90000.00, '12-month lease agreement with option to renew. Includes water and garbage collection.', 'active'),
      (5, 9, '2023-12-01', '2024-11-30', 65000.00, 130000.00, '12-month lease for luxury apartment. Tenant responsible for electricity and internet.', 'active'),
      (7, 11, '2024-03-01', '2025-02-28', 120000.00, 240000.00, '12-month lease for standalone house. Includes compound maintenance and security.', 'active'),
      (2, 8, '2024-01-15', '2025-01-14', 20000.00, 40000.00, '12-month lease for studio apartment. Perfect for young professional.', 'active'),
      (4, 3, '2023-11-01', '2024-10-31', 25000.00, 50000.00, '12-month lease agreement. Quiet residential area.', 'active')
    `)

    // Sample payments with Kenyan payment methods and realistic amounts
    await pool.execute(`
      INSERT INTO payments (tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status) VALUES
      -- John Kamau payments (Unit A101 - KES 28,000)
      (1, 1, 28000.00, '2024-01-01', 'mobile_money', 'rent', 'January rent payment via M-Pesa - Transaction ID: QA12345678', 'completed'),
      (1, 1, 28000.00, '2024-02-01', 'mobile_money', 'rent', 'February rent payment via M-Pesa - Transaction ID: QA23456789', 'completed'),
      (1, 1, 28000.00, '2024-03-01', 'mobile_money', 'rent', 'March rent payment via M-Pesa - Transaction ID: QA34567890', 'completed'),
      (1, 1, 28000.00, '2024-04-01', 'mobile_money', 'rent', 'April rent payment via M-Pesa - Transaction ID: QA45678901', 'completed'),
      (1, 1, 56000.00, '2024-01-01', 'bank_transfer', 'deposit', 'Security deposit payment - 2 months rent', 'completed'),
      
      -- Michael Otieno payments (Unit B201 - KES 45,000)
      (3, 2, 45000.00, '2024-02-01', 'bank_transfer', 'rent', 'February rent payment via bank transfer', 'completed'),
      (3, 2, 45000.00, '2024-03-01', 'bank_transfer', 'rent', 'March rent payment via bank transfer', 'completed'),
      (3, 2, 45000.00, '2024-04-01', 'mobile_money', 'rent', 'April rent payment via M-Pesa - Transaction ID: QA56789012', 'completed'),
      (3, 2, 90000.00, '2024-02-01', 'bank_transfer', 'deposit', 'Security deposit - 2 months rent', 'completed'),
      
      -- David Kipchoge payments (Unit D401 - KES 65,000)
      (5, 3, 65000.00, '2023-12-01', 'bank_transfer', 'rent', 'December rent payment', 'completed'),
      (5, 3, 65000.00, '2024-01-01', 'bank_transfer', 'rent', 'January rent payment', 'completed'),
      (5, 3, 65000.00, '2024-02-01', 'mobile_money', 'rent', 'February rent payment via M-Pesa - Transaction ID: QA67890123', 'completed'),
      (5, 3, 65000.00, '2024-03-01', 'bank_transfer', 'rent', 'March rent payment', 'completed'),
      (5, 3, 130000.00, '2023-12-01', 'bank_transfer', 'deposit', 'Security deposit payment', 'completed'),
      
      -- Robert Maina payments (Unit E501 - KES 120,000)
      (7, 4, 120000.00, '2024-03-01', 'bank_transfer', 'rent', 'March rent payment for house', 'completed'),
      (7, 4, 120000.00, '2024-04-01', 'bank_transfer', 'rent', 'April rent payment for house', 'completed'),
      (7, 4, 240000.00, '2024-03-01', 'bank_transfer', 'deposit', 'Security deposit for house - 2 months rent', 'completed'),
      
      -- Grace Wanjiku payments (Unit C302 - KES 20,000)
      (2, 5, 20000.00, '2024-01-15', 'mobile_money', 'rent', 'January rent payment via M-Pesa - Transaction ID: QA78901234', 'completed'),
      (2, 5, 20000.00, '2024-02-15', 'mobile_money', 'rent', 'February rent payment via M-Pesa - Transaction ID: QA89012345', 'completed'),
      (2, 5, 20000.00, '2024-03-15', 'mobile_money', 'rent', 'March rent payment via M-Pesa - Transaction ID: QA90123456', 'completed'),
      (2, 5, 40000.00, '2024-01-15', 'mobile_money', 'deposit', 'Security deposit via M-Pesa - Transaction ID: QA01234567', 'completed'),
      
      -- Faith Akinyi payments (Unit A103 - KES 25,000)
      (4, 6, 25000.00, '2023-11-01', 'mobile_money', 'rent', 'November rent payment via M-Pesa', 'completed'),
      (4, 6, 25000.00, '2023-12-01', 'mobile_money', 'rent', 'December rent payment via M-Pesa', 'completed'),
      (4, 6, 25000.00, '2024-01-01', 'mobile_money', 'rent', 'January rent payment via M-Pesa - Transaction ID: QA12345679', 'completed'),
      (4, 6, 25000.00, '2024-02-01', 'mobile_money', 'rent', 'February rent payment via M-Pesa - Transaction ID: QA23456780', 'completed'),
      (4, 6, 25000.00, '2024-03-01', 'mobile_money', 'rent', 'March rent payment via M-Pesa - Transaction ID: QA34567891', 'completed'),
      (4, 6, 50000.00, '2023-11-01', 'mobile_money', 'deposit', 'Security deposit payment', 'completed'),
      
      -- Some maintenance and other payments
      (1, 1, 2500.00, '2024-02-15', 'mobile_money', 'maintenance', 'Plumbing repair contribution', 'completed'),
      (3, 2, 5000.00, '2024-03-10', 'cash', 'late_fee', 'Late payment fee for March rent', 'completed'),
      (5, 3, 3000.00, '2024-01-20', 'mobile_money', 'other', 'Parking fee for additional vehicle', 'completed'),
      (7, 4, 8000.00, '2024-03-25', 'bank_transfer', 'maintenance', 'Garden maintenance and landscaping', 'completed'),
      
      -- Some pending payments to show arrears
      (6, NULL, 18000.00, '2024-04-01', 'mobile_money', 'rent', 'April rent payment - PENDING', 'pending'),
      (8, NULL, 60000.00, '2024-04-01', 'bank_transfer', 'rent', 'April rent payment - PENDING', 'pending')
    `)

    console.log("✅ Sample data inserted successfully")

    // Display summary of inserted data
    await displayDataSummary()
  } catch (error) {
    console.error("❌ Error inserting sample data:", error)
  }
}

const displayDataSummary = async () => {
  try {
    console.log("\n📊 DATABASE SUMMARY:")
    console.log("==================")

    // Count tenants
    const [tenantCount] = await pool.execute("SELECT COUNT(*) as count FROM tenants")
    console.log(`👥 Tenants: ${tenantCount[0].count}`)

    // Count units by status
    const [unitStats] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM units 
      GROUP BY status
    `)
    console.log("🏢 Units:")
    unitStats.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat.count}`)
    })

    // Count leases by status
    const [leaseStats] = await pool.execute(`
      SELECT status, COUNT(*) as count 
      FROM leases 
      GROUP BY status
    `)
    console.log("📄 Leases:")
    leaseStats.forEach((stat) => {
      console.log(`   ${stat.status}: ${stat.count}`)
    })

    // Count payments and total amount
    const [paymentStats] = await pool.execute(`
      SELECT 
        payment_method,
        COUNT(*) as method_count,
        SUM(amount) as method_total
      FROM payments 
      GROUP BY payment_method
    `)

    const [totalPayments] = await pool.execute(`
      SELECT 
        COUNT(*) as count,
        SUM(amount) as total
      FROM payments
    `)

    console.log("💰 Payments:")
    console.log(
      `   Total: ${totalPayments[0].count} payments worth KES ${Number(totalPayments[0].total).toLocaleString()}`,
    )
    console.log("   By method:")
    paymentStats.forEach((stat) => {
      console.log(
        `   ${stat.payment_method}: ${stat.method_count} payments (KES ${Number(stat.method_total).toLocaleString()})`,
      )
    })

    // Show rent range
    const [rentRange] = await pool.execute(`
      SELECT 
        MIN(rent_amount) as min_rent,
        MAX(rent_amount) as max_rent,
        AVG(rent_amount) as avg_rent
      FROM units
    `)

    console.log("🏠 Rent Information:")
    console.log(
      `   Range: KES ${Number(rentRange[0].min_rent).toLocaleString()} - KES ${Number(rentRange[0].max_rent).toLocaleString()}`,
    )
    console.log(`   Average: KES ${Number(rentRange[0].avg_rent).toLocaleString()}`)

    console.log("\n✅ Database initialization completed successfully!")
    console.log("🚀 You can now start the server with: npm run dev")
  } catch (error) {
    console.error("❌ Error displaying summary:", error)
  }
}

// Run the initialization
createTables().finally(() => {
  process.exit(0)
})
