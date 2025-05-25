import { query } from '../config/db.js';

// Get all payments
export const getAllPayments = async (req, res) => {
  try {
    const payments = await query(`
      SELECT p.*, t.name as tenant_name 
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      ORDER BY p.payment_date DESC
    `);
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [payment] = await query(`
      SELECT p.*, t.name as tenant_name 
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.id = ?
    `, [id]);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.status(200).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by tenant ID
export const getPaymentsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Check if tenant exists
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const payments = await query(`
      SELECT p.*, t.name as tenant_name 
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.tenant_id = ?
      ORDER BY p.payment_date DESC
    `, [tenantId]);
    
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get payments by date range
export const getPaymentsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    
    const payments = await query(`
      SELECT p.*, t.name as tenant_name 
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.payment_date BETWEEN ? AND ?
      ORDER BY p.payment_date DESC
    `, [startDate, endDate]);
    
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const { 
      tenant_id, 
      amount, 
      payment_date, 
      payment_method, 
      reference_number,
      description,
      status,
      lease_id
    } = req.body;
    
    // Check if tenant exists
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [tenant_id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // If lease_id is provided, check if lease exists
    if (lease_id) {
      const [lease] = await query('SELECT * FROM leases WHERE id = ?', [lease_id]);
      
      if (!lease) {
        return res.status(404).json({ message: 'Lease not found' });
      }
    }
    
    const result = await query(
      `INSERT INTO payments (
        tenant_id, amount, payment_date, payment_method, 
        reference_number, description, status, lease_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id, 
        amount, 
        payment_date, 
        payment_method, 
        reference_number,
        description,
        status || 'completed',
        lease_id
      ]
    );
    
    const [newPayment] = await query(`
      SELECT p.*, t.name as tenant_name 
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a payment
export const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tenant_id, 
      amount, 
      payment_date, 
      payment_method, 
      reference_number,
      description,
      status,
      lease_id
    } = req.body;
    
    // Check if payment exists
    const [payment] = await query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    // Check if tenant exists
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [tenant_id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // If lease_id is provided, check if lease exists
    if (lease_id) {
      const [lease] = await query('SELECT * FROM leases WHERE id = ?', [lease_id]);
      
      if (!lease) {
        return res.status(404).json({ message: 'Lease not found' });
      }
    }
    
    await query(
      `UPDATE payments SET 
        tenant_id = ?, 
        amount = ?, 
        payment_date = ?, 
        payment_method = ?, 
        reference_numbe2r = ?,
        description = ?,
        status = ?,
        lease_id = ?
      WHERE id = ?`,
      [
        tenant_id, 
        amount, 
        payment_date, 
        payment_method, 
        reference_number,
        description,
        status,
        lease_id,
        id
      ]
    );
    
    const [updatedPayment] = await query(`
      SELECT p.*, t.name as tenant_name 
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      WHERE p.id = ?
    `, [id]);
    
    res.status(200).json(updatedPayment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a payment
export const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if payment exists
    const [payment] = await query('SELECT * FROM payments WHERE id = ?', [id]);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    await query('DELETE FROM payments WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};