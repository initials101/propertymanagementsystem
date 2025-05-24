import { pool } from "../config/database.js"

export class Payment {
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT p.*, 
             t.name as tenant_name,
             t.email as tenant_email,
             u.unit_number,
             l.rent_amount as lease_rent
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN leases l ON p.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      ORDER BY p.payment_date DESC
    `)
    return rows
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `
      SELECT p.*,
             t.name as tenant_name,
             t.email as tenant_email,
             u.unit_number
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN leases l ON p.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE p.id = ?
    `,
      [id],
    )
    return rows[0]
  }

  static async create(paymentData) {
    const { tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status } = paymentData
    const [result] = await pool.execute(
      `
      INSERT INTO payments (tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status || "completed"],
    )
    return result.insertId
  }

  static async update(id, paymentData) {
    const { tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status } = paymentData
    const [result] = await pool.execute(
      `
      UPDATE payments 
      SET tenant_id = ?, lease_id = ?, amount = ?, payment_date = ?, 
          payment_method = ?, payment_type = ?, description = ?, status = ?
      WHERE id = ?
    `,
      [tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status, id],
    )
    return result.affectedRows > 0
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM payments WHERE id = ?", [id])
    return result.affectedRows > 0
  }

  static async getByTenant(tenantId) {
    const [rows] = await pool.execute(
      `
      SELECT p.*, u.unit_number
      FROM payments p
      LEFT JOIN leases l ON p.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE p.tenant_id = ?
      ORDER BY p.payment_date DESC
    `,
      [tenantId],
    )
    return rows
  }

  static async getPaymentHistory(startDate, endDate) {
    const [rows] = await pool.execute(
      `
      SELECT p.*, 
             t.name as tenant_name,
             u.unit_number
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN leases l ON p.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE p.payment_date BETWEEN ? AND ?
      ORDER BY p.payment_date DESC
    `,
      [startDate, endDate],
    )
    return rows
  }

  static async getArrearsReport() {
    const [rows] = await pool.execute(`
      SELECT 
        t.id,
        t.name as tenant_name,
        t.email,
        t.phone,
        u.unit_number,
        l.rent_amount,
        l.start_date,
        COALESCE(SUM(p.amount), 0) as total_paid,
        (DATEDIFF(CURDATE(), l.start_date) / 30) * l.rent_amount as expected_amount,
        ((DATEDIFF(CURDATE(), l.start_date) / 30) * l.rent_amount) - COALESCE(SUM(p.amount), 0) as arrears
      FROM tenants t
      JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
      JOIN units u ON l.unit_id = u.id
      LEFT JOIN payments p ON t.id = p.tenant_id AND p.payment_type = 'rent'
      GROUP BY t.id, l.id
      HAVING arrears > 0
      ORDER BY arrears DESC
    `)
    return rows
  }

  static async getMonthlyStats() {
    const [rows] = await pool.execute(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') as month,
        COUNT(*) as payment_count,
        SUM(amount) as total_amount,
        payment_type
      FROM payments
      WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY month, payment_type
      ORDER BY month DESC, payment_type
    `)
    return rows
  }
}
