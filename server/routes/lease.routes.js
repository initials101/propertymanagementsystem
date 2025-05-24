import express from "express"
import { Lease } from "../models/Lease.js"

const router = express.Router()

// GET /api/leases - Get all leases
router.get("/", async (req, res) => {
  try {
    const leases = await Lease.getAll()
    res.json(leases)
  } catch (error) {
    console.error("Error fetching leases:", error)
    res.status(500).json({ error: "Failed to fetch leases" })
  }
})

// GET /api/leases/active - Get active leases
router.get("/active", async (req, res) => {
  try {
    const leases = await Lease.getActiveLeases()
    res.json(leases)
  } catch (error) {
    console.error("Error fetching active leases:", error)
    res.status(500).json({ error: "Failed to fetch active leases" })
  }
})

// GET /api/leases/expiring - Get expiring leases
router.get("/expiring", async (req, res) => {
  try {
    const { days = 30 } = req.query
    const leases = await Lease.getExpiringLeases(Number.parseInt(days))
    res.json(leases)
  } catch (error) {
    console.error("Error fetching expiring leases:", error)
    res.status(500).json({ error: "Failed to fetch expiring leases" })
  }
})

// GET /api/leases/:id - Get lease by ID
router.get("/:id", async (req, res) => {
  try {
    const lease = await Lease.getById(req.params.id)
    if (!lease) {
      return res.status(404).json({ error: "Lease not found" })
    }
    res.json(lease)
  } catch (error) {
    console.error("Error fetching lease:", error)
    res.status(500).json({ error: "Failed to fetch lease" })
  }
})

// POST /api/leases - Create new lease
router.post("/", async (req, res) => {
  try {
    const { tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms } = req.body

    if (!tenant_id || !unit_id || !start_date || !end_date || !rent_amount) {
      return res.status(400).json({ error: "All required fields must be provided" })
    }

    const leaseId = await Lease.create({
      tenant_id,
      unit_id,
      start_date,
      end_date,
      rent_amount,
      security_deposit,
      lease_terms,
    })

    const newLease = await Lease.getById(leaseId)
    res.status(201).json(newLease)
  } catch (error) {
    console.error("Error creating lease:", error)
    res.status(500).json({ error: "Failed to create lease" })
  }
})

// PUT /api/leases/:id - Update lease
router.put("/:id", async (req, res) => {
  try {
    const { tenant_id, unit_id, start_date, end_date, rent_amount, security_deposit, lease_terms, status } = req.body

    if (!tenant_id || !unit_id || !start_date || !end_date || !rent_amount) {
      return res.status(400).json({ error: "All required fields must be provided" })
    }

    const updated = await Lease.update(req.params.id, {
      tenant_id,
      unit_id,
      start_date,
      end_date,
      rent_amount,
      security_deposit,
      lease_terms,
      status,
    })

    if (!updated) {
      return res.status(404).json({ error: "Lease not found" })
    }

    const updatedLease = await Lease.getById(req.params.id)
    res.json(updatedLease)
  } catch (error) {
    console.error("Error updating lease:", error)
    res.status(500).json({ error: "Failed to update lease" })
  }
})

// PATCH /api/leases/:id/terminate - Terminate lease
router.patch("/:id/terminate", async (req, res) => {
  try {
    const terminated = await Lease.terminate(req.params.id)
    if (!terminated) {
      return res.status(404).json({ error: "Lease not found" })
    }

    const updatedLease = await Lease.getById(req.params.id)
    res.json(updatedLease)
  } catch (error) {
    console.error("Error terminating lease:", error)
    res.status(500).json({ error: "Failed to terminate lease" })
  }
})

export default router
