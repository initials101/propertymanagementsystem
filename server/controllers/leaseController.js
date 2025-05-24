import { query } from '../config/db.js';

// Get all leases
export const getAllLeases = async (req, res) => {
  try {
    const leases = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      ORDER BY l.start_date DESC
    `);
    res.status(200).json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get lease by ID
export const getLeaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [lease] = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `, [id]);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    res.status(200).json(lease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leases by tenant ID
export const getLeasesByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    // Check if tenant exists
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    const leases = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.tenant_id = ?
      ORDER BY l.start_date DESC
    `, [tenantId]);
    
    res.status(200).json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leases by unit ID
export const getLeasesByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    
    // Check if unit exists
    const [unit] = await query('SELECT * FROM units WHERE id = ?', [unitId]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    const leases = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.unit_id = ?
      ORDER BY l.start_date DESC
    `, [unitId]);
    
    res.status(200).json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active leases
export const getActiveLeases = async (req, res) => {
  try {
    const leases = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.end_date ASC
    `);
    
    res.status(200).json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get leases expiring soon (next 30 days)
export const getExpiringSoonLeases = async (req, res) => {
  try {
    const leases = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.status = 'active' 
        AND l.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY l.end_date ASC
    `);
    
    res.status(200).json(leases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new lease
export const createLease = async (req, res) => {
  try {
    const { 
      tenant_id, 
      unit_id, 
      start_date, 
      end_date, 
      rent_amount,
      security_deposit,
      lease_terms,
      status
    } = req.body;
    
    // Check if tenant exists
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [tenant_id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Check if unit exists
    const [unit] = await query('SELECT * FROM units WHERE id = ?', [unit_id]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    // Check if unit is available (not already occupied with active lease)
    if (status === 'active' || status === 'pending') {
      const [activeLeaseCheck] = await query(`
        SELECT COUNT(*) as leaseCount 
        FROM leases 
        WHERE unit_id = ? AND (status = 'active' OR status = 'pending')
      `, [unit_id]);
      
      if (activeLeaseCheck.leaseCount > 0) {
        return res.status(400).json({ 
          message: 'Unit already has an active or pending lease' 
        });
      }
    }
    
    // Create the lease
    const result = await query(
      `INSERT INTO leases (
        tenant_id, unit_id, start_date, end_date, 
        rent_amount, security_deposit, lease_terms, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tenant_id, 
        unit_id, 
        start_date, 
        end_date, 
        rent_amount || unit.rent_amount,
        security_deposit,
        lease_terms,
        status || 'pending'
      ]
    );
    
    // If lease status is active, update unit status to occupied
    if (status === 'active') {
      await query('UPDATE units SET status = "occupied" WHERE id = ?', [unit_id]);
    }
    
    const [newLease] = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newLease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a lease
export const updateLease = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tenant_id, 
      unit_id, 
      start_date, 
      end_date, 
      rent_amount,
      security_deposit,
      lease_terms,
      status
    } = req.body;
    
    // Check if lease exists
    const [lease] = await query('SELECT * FROM leases WHERE id = ?', [id]);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Check if tenant exists
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [tenant_id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Check if unit exists
    const [unit] = await query('SELECT * FROM units WHERE id = ?', [unit_id]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    // If unit is changing, check if new unit is available
    if (unit_id !== lease.unit_id && (status === 'active' || status === 'pending')) {
      const [activeLeaseCheck] = await query(`
        SELECT COUNT(*) as leaseCount 
        FROM leases 
        WHERE unit_id = ? AND id != ? AND (status = 'active' OR status = 'pending')
      `, [unit_id, id]);
      
      if (activeLeaseCheck.leaseCount > 0) {
        return res.status(400).json({ 
          message: 'New unit already has an active or pending lease' 
        });
      }
    }
    
    // Update the lease
    await query(
      `UPDATE leases SET 
        tenant_id = ?, 
        unit_id = ?, 
        start_date = ?, 
        end_date = ?, 
        rent_amount = ?,
        security_deposit = ?,
        lease_terms = ?,
        status = ?
      WHERE id = ?`,
      [
        tenant_id, 
        unit_id, 
        start_date, 
        end_date, 
        rent_amount,
        security_deposit,
        lease_terms,
        status,
        id
      ]
    );
    
    // Handle unit status changes based on lease status
    if (status === 'active') {
      // If lease is active, mark the unit as occupied
      await query('UPDATE units SET status = "occupied" WHERE id = ?', [unit_id]);
      
      // If unit changed, mark the old unit as vacant
      if (unit_id !== lease.unit_id && lease.status === 'active') {
        await query('UPDATE units SET status = "vacant" WHERE id = ?', [lease.unit_id]);
      }
    } else if (lease.status === 'active' && status !== 'active') {
      // If lease was active but now is not, mark unit as vacant
      await query('UPDATE units SET status = "vacant" WHERE id = ?', [unit_id]);
    }
    
    const [updatedLease] = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `, [id]);
    
    res.status(200).json(updatedLease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Terminate a lease
export const terminateLease = async (req, res) => {
  try {
    const { id } = req.params;
    const { termination_date, termination_reason } = req.body;
    
    // Check if lease exists
    const [lease] = await query('SELECT * FROM leases WHERE id = ?', [id]);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Update lease status to terminated
    await query(
      `UPDATE leases SET 
        status = 'terminated', 
        termination_date = ?, 
        termination_reason = ?
      WHERE id = ?`,
      [termination_date || new Date(), termination_reason, id]
    );
    
    // Update unit status to vacant
    await query('UPDATE units SET status = "vacant" WHERE id = ?', [lease.unit_id]);
    
    const [terminatedLease] = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `, [id]);
    
    res.status(200).json(terminatedLease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Renew a lease
export const renewLease = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      new_start_date, 
      new_end_date, 
      new_rent_amount,
      new_lease_terms
    } = req.body;
    
    // Check if lease exists
    const [lease] = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `, [id]);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Create a new lease record for the renewal
    const result = await query(
      `INSERT INTO leases (
        tenant_id, unit_id, start_date, end_date, 
        rent_amount, security_deposit, lease_terms, status,
        previous_lease_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lease.tenant_id, 
        lease.unit_id, 
        new_start_date, 
        new_end_date, 
        new_rent_amount || lease.rent_amount,
        lease.security_deposit,
        new_lease_terms || lease.lease_terms,
        'active',
        id
      ]
    );
    
    // Update the previous lease status to completed
    await query(
      `UPDATE leases SET 
        status = 'completed', 
        renewal_id = ?
      WHERE id = ?`,
      [result.insertId, id]
    );
    
    // Make sure unit remains marked as occupied
    await query('UPDATE units SET status = "occupied" WHERE id = ?', [lease.unit_id]);
    
    const [newLease] = await query(`
      SELECT l.*, t.name as tenant_name, u.unit_number
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.id = ?
    `, [result.insertId]);
    
    res.status(201).json(newLease);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a lease
export const deleteLease = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if lease exists
    const [lease] = await query('SELECT * FROM leases WHERE id = ?', [id]);
    
    if (!lease) {
      return res.status(404).json({ message: 'Lease not found' });
    }
    
    // Only allow deletion of draft or pending leases
    if (lease.status === 'active' || lease.status === 'completed' || lease.status === 'terminated') {
      return res.status(400).json({ 
        message: 'Cannot delete active, completed, or terminated leases. Use terminate lease function instead.' 
      });
    }
    
    await query('DELETE FROM leases WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Lease deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};