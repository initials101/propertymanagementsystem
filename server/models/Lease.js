import { pool } from "../config/database.js"

export class Lease {
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT l.*, 
             t.name as tenant_name,
             t.email as tenant_email,
             u.unit_number,
             u.type as unit_type
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      ORDER BY l.start_date DESC
    `)
    return rows
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `
      SELECT l.*,
             t.name as tenant_name,
             t.email as tenant_email,
             t.phone as tenant_phone,
             u.unit_number,
             u.type as unit_type
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `,
      [id],
    )
    return rows[0]
  }

  static async create(leaseData) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      const { tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms } = leaseData

      // Create lease
      const [result] = await connection.execute(
        `
        INSERT INTO leases (tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `,
        [tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms],
      )

      // Update unit status to occupied
      await connection.execute(
        `
        UPDATE units SET status = 'occupied' WHERE id = ?
      `,
        [unit_id],
      )

      await connection.commit()
      return result.insertId
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async update(id, leaseData) {
    const { tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms, status } = leaseData
    const [result] = await pool.execute(
      `
      UPDATE leases 
      SET tenant_id = ?, unit_id = ?, start_date = ?, end_date = ?, rent_amount = ?, 
          security_deposit = ?, lease_terms = ?, status = ?
      WHERE id = ?
    `,
      [tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms, status, id],
    )
    return result.affectedRows > 0
  }

  static async terminate(id) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Get lease details
      const [leaseRows] = await connection.execute("SELECT unit_id FROM leases WHERE id = ?", [id])
      if (leaseRows.length === 0) {
        throw new Error("Lease not found")
      }

      // Update lease status
      await connection.execute(
        `
        UPDATE leases SET status = 'terminated' WHERE id = ?
      `,
        [id],
      )

      // Update unit status to vacant
      await connection.execute(
        `
        UPDATE units SET status = 'vacant' WHERE id = ?
      `,
        [leaseRows[0].unit_id],
      )

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  static async getActiveLeases() {
    const [rows] = await pool.execute(`
      SELECT l.*, 
             t.name as tenant_name,
             u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.end_date
    `)
    return rows
  }

  static async getExpiringLeases(days = 30) {
    const [rows] = await pool.execute(
      `
      SELECT l.*, 
             t.name as tenant_name,
             t.email as tenant_email,
             u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.status = 'active' 
      AND l.end_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
      ORDER BY l.end_date
    `,
      [days],
    )
    return rows
  }
}
