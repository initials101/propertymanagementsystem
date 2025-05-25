import { pool } from "../config/database.js"

const updateDatabase = async () => {
  try {
    console.log("🔄 Updating database schema...")

    // Update the payment_method enum to include mobile_money
    await pool.execute(`
      ALTER TABLE payments 
      MODIFY COLUMN payment_method ENUM('cash', 'check', 'bank_transfer', 'credit_card', 'mobile_money') NOT NULL
    `)

    console.log("✅ Payment method enum updated successfully")

    // Check if the update was successful
    const [result] = await pool.execute(`
      SHOW COLUMNS FROM payments LIKE 'payment_method'
    `)

    console.log("📋 Updated payment_method column:")
    console.log(result[0])

    console.log("✅ Database schema update completed!")
  } catch (error) {
    console.error("❌ Error updating database:", error)
  }
}

// Run the update
updateDatabase().finally(() => {
  process.exit(0)
})
