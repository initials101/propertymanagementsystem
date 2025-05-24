import express from "express"
import { Tenant } from "../models/Tenant.js"

const router = express.Router()

// GET /api/tenants - Get all tenants
router.get("/", async (req, res) => {
  try {
    const { search } = req.query
    let tenants

    if (search) {
      tenants = await Tenant.search(search)
    } else {
      tenants = await Tenant.getAll()
    }

    res.json(tenants)
  } catch (error) {
    console.error("Error fetching tenants:", error)
    res.status(500).json({ error: "Failed to fetch tenants" })
  }
})

// GET /api/tenants/:id - Get tenant by ID
router.get("/:id", async (req, res) => {
  try {
    const tenant = await Tenant.getById(req.params.id)
    if (!tenant) {
      return res.status(404).json({ error: "Tenant not found" })
    }
    res.json(tenant)
  } catch (error) {
    console.error("Error fetching tenant:", error)
    res.status(500).json({ error: "Failed to fetch tenant" })
  }
})

// POST /api/tenants - Create new tenant
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, address, emergency_contact, emergency_phone } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" })
    }

    const tenantId = await Tenant.create({
      name,
      email,
      phone,
      address,
      emergency_contact,
      emergency_phone,
    })

    const newTenant = await Tenant.getById(tenantId)
    res.status(201).json(newTenant)
  } catch (error) {
    console.error("Error creating tenant:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Email already exists" })
    } else {
      res.status(500).json({ error: "Failed to create tenant" })
    }
  }
})

// PUT /api/tenants/:id - Update tenant
router.put("/:id", async (req, res) => {
  try {
    const { name, email, phone, address, emergency_contact, emergency_phone } = req.body

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" })
    }

    const updated = await Tenant.update(req.params.id, {
      name,
      email,
      phone,
      address,
      emergency_contact,
      emergency_phone,
    })

    if (!updated) {
      return res.status(404).json({ error: "Tenant not found" })
    }

    const updatedTenant = await Tenant.getById(req.params.id)
    res.json(updatedTenant)
  } catch (error) {
    console.error("Error updating tenant:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Email already exists" })
    } else {
      res.status(500).json({ error: "Failed to update tenant" })
    }
  }
})

// DELETE /api/tenants/:id - Delete tenant
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Tenant.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: "Tenant not found" })
    }
    res.json({ message: "Tenant deleted successfully" })
  } catch (error) {
    console.error("Error deleting tenant:", error)
    res.status(500).json({ error: "Failed to delete tenant" })
  }
})

export default router
