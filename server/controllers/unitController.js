import { query } from '../config/db.js';

// Get all units
export const getAllUnits = async (req, res) => {
  try {
    const units = await query('SELECT * FROM units ORDER BY unit_number ASC');
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unit by ID
export const getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const [unit] = await query('SELECT * FROM units WHERE id = ?', [id]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get unit by unit number
export const getUnitByNumber = async (req, res) => {
  try {
    const { unitNumber } = req.params;
    const [unit] = await query('SELECT * FROM units WHERE unit_number = ?', [unitNumber]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get vacant units
export const getVacantUnits = async (req, res) => {
  try {
    const units = await query('SELECT * FROM units WHERE status = "vacant" ORDER BY unit_number ASC');
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get occupied units
export const getOccupiedUnits = async (req, res) => {
  try {
    const units = await query('SELECT * FROM units WHERE status = "occupied" ORDER BY unit_number ASC');
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new unit
export const createUnit = async (req, res) => {
  try {
    const { 
      unit_number, 
      type, 
      square_feet,
      bedrooms,
      bathrooms,
      rent_amount, 
      status, 
      features,
      address,
      notes
    } = req.body;
    
    // Check if unit number already exists
    const [existingUnit] = await query('SELECT * FROM units WHERE unit_number = ?', [unit_number]);
    
    if (existingUnit) {
      return res.status(400).json({ message: 'Unit number already exists' });
    }
    
    const result = await query(
      `INSERT INTO units (
        unit_number, type, square_feet, bedrooms, bathrooms, 
        rent_amount, status, features, address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unit_number, type, square_feet, bedrooms, bathrooms, 
        rent_amount, status || 'vacant', features, address, notes
      ]
    );
    
    const newUnit = {
      id: result.insertId,
      unit_number,
      type,
      square_feet,
      bedrooms,
      bathrooms,
      rent_amount,
      status: status || 'vacant',
      features,
      address,
      notes
    };
    
    res.status(201).json(newUnit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a unit
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      unit_number, 
      type, 
      square_feet,
      bedrooms,
      bathrooms,
      rent_amount, 
      status, 
      features,
      address,
      notes
    } = req.body;
    
    // Check if unit exists
    const [unit] = await query('SELECT * FROM units WHERE id = ?', [id]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    // Check if unit number is being changed and if the new number already exists
    if (unit_number !== unit.unit_number) {
      const [existingUnit] = await query(
        'SELECT * FROM units WHERE unit_number = ? AND id != ?', 
        [unit_number, id]
      );
      
      if (existingUnit) {
        return res.status(400).json({ message: 'Unit number already exists' });
      }
    }
    
    await query(
      `UPDATE units SET 
        unit_number = ?, 
        type = ?, 
        square_feet = ?,
        bedrooms = ?,
        bathrooms = ?,
        rent_amount = ?, 
        status = ?, 
        features = ?,
        address = ?,
        notes = ?
      WHERE id = ?`,
      [
        unit_number, 
        type, 
        square_feet,
        bedrooms,
        bathrooms,
        rent_amount, 
        status, 
        features,
        address,
        notes,
        id
      ]
    );
    
    const updatedUnit = {
      id: parseInt(id),
      unit_number,
      type,
      square_feet,
      bedrooms,
      bathrooms,
      rent_amount,
      status,
      features,
      address,
      notes
    };
    
    res.status(200).json(updatedUnit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a unit
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if unit exists
    const [unit] = await query('SELECT * FROM units WHERE id = ?', [id]);
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    
    // Check if unit has any active leases
    const [activeLeases] = await query(
      'SELECT COUNT(*) as leaseCount FROM leases WHERE unit_id = ? AND (status = "active" OR status = "pending")',
      [id]
    );
    
    if (activeLeases.leaseCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete unit with active leases. Please terminate all leases first.' 
      });
    }
    
    await query('DELETE FROM units WHERE id = ?', [id]);
    
    res.status(200).json({ message: 'Unit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};