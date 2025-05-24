import { pool } from "../config/database.js"

export class Unit {
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT u.*, 
             t.name as tenant_name,
             t.email as tenant_email,
             l.start_date,
             l.end_date,
             l.rent_amount as lease_rent
      FROM units u
      LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
      LEFT JOIN tenants t ON l.tenant_id = t.id
      ORDER BY u.unit_number
    `)
    return rows
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `
      SELECT u.*,
             t.name as tenant_name,
             t.email as tenant_email,
             l.start_date,
             l.end_date,
             l.rent_amount as lease_rent
      FROM units u
      LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
      LEFT JOIN tenants t ON l.tenant_id = t.id
      WHERE u.id = ?
    `,
      [id],
    )
    return rows[0]
  }

  static async create(unitData) {
    const { unit_number, type, rent_amount, status, description } = unitData
    const [result] = await pool.execute(
      `
      INSERT INTO units (unit_number, type, rent_amount, status, description)
      VALUES (?, ?, ?, ?, ?)
    `,
      [unit_number, type, rent_amount, status || "vacant", description],
    )
    return result.insertId
  }

  static async update(id, unitData) {
    const { unit_number, type, rent_amount, status, description } = unitData
    const [result] = await pool.execute(
      `
      UPDATE units 
      SET unit_number = ?, type = ?, rent_amount = ?, status = ?, description = ?
      WHERE id = ?
    `,
      [unit_number, type, rent_amount, status, description, id],
    )
    return result.affectedRows > 0
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM units WHERE id = ?", [id])
    return result.affectedRows > 0
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(
      `
      UPDATE units SET status = ? WHERE id = ?
    `,
      [status, id],
    )
    return result.affectedRows > 0
  }

  static async getVacantUnits() {
    const [rows] = await pool.execute(`
      SELECT * FROM units WHERE status = 'vacant' ORDER BY unit_number
    `)
    return rows
  }

  static async getOccupancyStats() {
    const [rows] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM units)), 2) as percentage
      FROM units 
      GROUP BY status
    `)
    return rows
  }
}
