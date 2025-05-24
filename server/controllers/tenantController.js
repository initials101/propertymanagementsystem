import { query } from '../config/db.js';

// Get all tenants
export const getAllTenants = async (req, res) => {
  try {
    const tenants = await query('SELECT * FROM tenants ORDER BY name ASC');
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tenant by ID
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    res.status(200).json(tenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new tenant
export const createTenant = async (req, res) => {
  try {
    const { name, email, phone, address, emergency_contact, notes } = req.body;
    
    const result = await query(
      'INSERT INTO tenants (name, email, phone, address, emergency_contact, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, address, emergency_contact, notes]
    );
    
    const newTenant = {
      id: result.insertId,
      name,
      email,
      phone,
      address,
      emergency_contact,
      notes
    };
    
    res.status(201).json(newTenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a tenant
export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, emergency_contact, notes } = req.body;
    
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    await query(
      'UPDATE tenants SET name = ?, email = ?, phone = ?, address = ?, emergency_contact = ?, notes = ? WHERE id = ?',
      [name, email, phone, address, emergency_contact, notes, id]
    );
    
    const updatedTenant = {
      id: parseInt(id),
      name,
      email,
      phone,
      address,
      emergency_contact,
      notes
    };
    
    res.status(200).json(updatedTenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a tenant
export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [tenant] = await query('SELECT * FROM tenants WHERE id = ?', [id]);
    
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    
    // Check if tenant has any active leases
    const [activeLeases] = await query(
      'SELECT COUNT(*) as leaseCount FROM leases WHERE tenant_id = ? AND (status = "active" OR status = "pending")',
      [id]
    );
    
    if (activeLeases.leaseCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete tenant with active leases. Please terminate all leases first.' 
      });
    }
    
    await query('DELETE FROM tenants WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Tenant deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search tenants
export const searchTenants = async (req, res) => {
  try {
    const { query: searchQuery } = req.params;
    const searchTerm = `%${searchQuery}%`;
    
    const tenants = await query(
      'SELECT * FROM tenants WHERE name LIKE ? OR email LIKE ? OR phone LIKE ? ORDER BY name ASC',
      [searchTerm, searchTerm, searchTerm]
    );
    
    res.status(200).json(tenants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};