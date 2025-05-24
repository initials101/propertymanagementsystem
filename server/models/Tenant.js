import { pool } from "../config/database.js"

export class Tenant {
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT t.*, 
             COUNT(l.id) as active_leases,
             SUM(CASE WHEN p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN p.amount ELSE 0 END) as recent_payments
      FROM tenants t
      LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
      LEFT JOIN payments p ON t.id = p.tenant_id
      GROUP BY t.id
      ORDER BY t.name
    `)
    return rows
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `
      SELECT t.*,
             l.unit_id,
             u.unit_number,
             l.rent_amount,
             l.start_date,
             l.end_date
      FROM tenants t
      LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE t.id = ?
    `,
      [id],
    )
    return rows[0]
  }

  static async create(tenantData) {
    const { name, email, phone, address, emergency_contact, emergency_phone } = tenantData
    const [result] = await pool.execute(
      `
      INSERT INTO tenants (name, email, phone, address, emergency_contact, emergency_phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [name, email, phone, address, emergency_contact, emergency_phone],
    )
    return result.insertId
  }

  static async update(id, tenantData) {
    const { name, email, phone, address, emergency_contact, emergency_phone } = tenantData
    const [result] = await pool.execute(
      `
      UPDATE tenants 
      SET name = ?, email = ?, phone = ?, address = ?, emergency_contact = ?, emergency_phone = ?
      WHERE id = ?
    `,
      [name, email, phone, address, emergency_contact, emergency_phone, id],
    )
    return result.affectedRows > 0
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM tenants WHERE id = ?", [id])
    return result.affectedRows > 0
  }

  static async search(query) {
    const searchTerm = `%${query}%`
    const [rows] = await pool.execute(
      `
      SELECT t.*, 
             COUNT(l.id) as active_leases
      FROM tenants t
      LEFT JOIN leases l ON t.id = l.tenant_id AND l.status = 'active'
      WHERE t.name LIKE ? OR t.email LIKE ? OR t.phone LIKE ?
      GROUP BY t.id
      ORDER BY t.name
    `,
      [searchTerm, searchTerm, searchTerm],
    )
    return rows
  }
}
