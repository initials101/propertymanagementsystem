import { pool } from "../config/database.js"

export class Invoice {
  static async getAll() {
    const [rows] = await pool.execute(`
      SELECT i.*, 
             t.name as tenant_name,
             t.email as tenant_email,
             u.unit_number,
             l.rent_amount as lease_rent
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      LEFT JOIN leases l ON i.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      ORDER BY i.issue_date DESC, i.invoice_number DESC
    `)
    return rows
  }

  static async getById(id) {
    const [rows] = await pool.execute(
      `
      SELECT i.*,
             t.name as tenant_name,
             t.email as tenant_email,
             t.phone as tenant_phone,
             t.address as tenant_address,
             u.unit_number,
             l.rent_amount as lease_rent
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      LEFT JOIN leases l ON i.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE i.id = ?
    `,
      [id],
    )
    return rows[0]
  }

  static async create(invoiceData) {
    const {
      invoice_number,
      tenant_id,
      lease_id,
      issue_date,
      due_date,
      amount,
      tax_amount,
      total_amount,
      description,
      line_items,
      payment_terms,
      notes,
      status,
    } = invoiceData

    const [result] = await pool.execute(
      `
      INSERT INTO invoices (invoice_number, tenant_id, lease_id, issue_date, due_date, amount, tax_amount, total_amount, status, description, line_items, payment_terms, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        invoice_number,
        tenant_id,
        lease_id,
        issue_date,
        due_date,
        amount,
        tax_amount || 0,
        total_amount,
        status || "draft",
        description,
        JSON.stringify(line_items),
        payment_terms,
        notes,
      ],
    )
    return result.insertId
  }

  static async update(id, invoiceData) {
    const {
      tenant_id,
      lease_id,
      issue_date,
      due_date,
      amount,
      tax_amount,
      total_amount,
      description,
      line_items,
      payment_terms,
      notes,
      status,
    } = invoiceData

    const [result] = await pool.execute(
      `
      UPDATE invoices 
      SET tenant_id = ?, lease_id = ?, issue_date = ?, due_date = ?, amount = ?, tax_amount = ?, 
          total_amount = ?, description = ?, line_items = ?, payment_terms = ?, notes = ?, status = ?
      WHERE id = ?
    `,
      [
        tenant_id,
        lease_id,
        issue_date,
        due_date,
        amount,
        tax_amount || 0,
        total_amount,
        description,
        JSON.stringify(line_items),
        payment_terms,
        notes,
        status,
        id,
      ],
    )
    return result.affectedRows > 0
  }

  static async delete(id) {
    const [result] = await pool.execute("DELETE FROM invoices WHERE id = ?", [id])
    return result.affectedRows > 0
  }

  static async updateStatus(id, status) {
    const [result] = await pool.execute(`UPDATE invoices SET status = ? WHERE id = ?`, [status, id])
    return result.affectedRows > 0
  }

  static async getByTenant(tenantId) {
    const [rows] = await pool.execute(
      `
      SELECT i.*, u.unit_number
      FROM invoices i
      LEFT JOIN leases l ON i.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE i.tenant_id = ?
      ORDER BY i.issue_date DESC
    `,
      [tenantId],
    )
    return rows
  }

  static async getOverdueInvoices() {
    const [rows] = await pool.execute(`
      SELECT i.*, 
             t.name as tenant_name,
             t.email as tenant_email,
             t.phone as tenant_phone,
             u.unit_number
      FROM invoices i
      JOIN tenants t ON i.tenant_id = t.id
      LEFT JOIN leases l ON i.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE i.due_date < CURDATE() AND i.status IN ('sent', 'draft')
      ORDER BY i.due_date ASC
    `)
    return rows
  }

  static async getInvoiceStats() {
    const [rows] = await pool.execute(`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_amount) as total_amount
      FROM invoices
      WHERE issue_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY status
    `)
    return rows
  }

  static async generateInvoiceNumber() {
    const year = new Date().getFullYear()
    const [rows] = await pool.execute(`SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?`, [
      `INV-${year}-%`,
    ])
    const count = rows[0].count + 1
    return `INV-${year}-${count.toString().padStart(3, "0")}`
  }

  static async markAsPaid(id, paymentId = null) {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Update invoice status
      await connection.execute(`UPDATE invoices SET status = 'paid' WHERE id = ?`, [id])

      // If payment ID is provided, link it to the invoice
      if (paymentId) {
        await connection.execute(`UPDATE payments SET invoice_id = ? WHERE id = ?`, [id, paymentId])
      }

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
