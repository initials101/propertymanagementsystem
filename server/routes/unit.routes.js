import express from "express"
import { Unit } from "../models/Unit.js"

const router = express.Router()

// GET /api/units - Get all units
router.get("/", async (req, res) => {
  try {
    const units = await Unit.getAll()
    res.json(units)
  } catch (error) {
    console.error("Error fetching units:", error)
    res.status(500).json({ error: "Failed to fetch units" })
  }
})

// GET /api/units/vacant - Get vacant units
router.get("/vacant", async (req, res) => {
  try {
    const units = await Unit.getVacantUnits()
    res.json(units)
  } catch (error) {
    console.error("Error fetching vacant units:", error)
    res.status(500).json({ error: "Failed to fetch vacant units" })
  }
})

// GET /api/units/occupancy-stats - Get occupancy statistics
router.get("/occupancy-stats", async (req, res) => {
  try {
    const stats = await Unit.getOccupancyStats()
    res.json(stats)
  } catch (error) {
    console.error("Error fetching occupancy stats:", error)
    res.status(500).json({ error: "Failed to fetch occupancy stats" })
  }
})

// GET /api/units/:id - Get unit by ID
router.get("/:id", async (req, res) => {
  try {
    const unit = await Unit.getById(req.params.id)
    if (!unit) {
      return res.status(404).json({ error: "Unit not found" })
    }
    res.json(unit)
  } catch (error) {
    console.error("Error fetching unit:", error)
    res.status(500).json({ error: "Failed to fetch unit" })
  }
})

// POST /api/units - Create new unit
router.post("/", async (req, res) => {
  try {
    const { unit_number, type, rent_amount, status, description } = req.body

    if (!unit_number || !type || !rent_amount) {
      return res.status(400).json({ error: "Unit number, type, and rent amount are required" })
    }

    const unitId = await Unit.create({
      unit_number,
      type,
      rent_amount,
      status,
      description,
    })

    const newUnit = await Unit.getById(unitId)
    res.status(201).json(newUnit)
  } catch (error) {
    console.error("Error creating unit:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Unit number already exists" })
    } else {
      res.status(500).json({ error: "Failed to create unit" })
    }
  }
})

// PUT /api/units/:id - Update unit
router.put("/:id", async (req, res) => {
  try {
    const { unit_number, type, rent_amount, status, description } = req.body

    if (!unit_number || !type || !rent_amount) {
      return res.status(400).json({ error: "Unit number, type, and rent amount are required" })
    }

    const updated = await Unit.update(req.params.id, {
      unit_number,
      type,
      rent_amount,
      status,
      description,
    })

    if (!updated) {
      return res.status(404).json({ error: "Unit not found" })
    }

    const updatedUnit = await Unit.getById(req.params.id)
    res.json(updatedUnit)
  } catch (error) {
    console.error("Error updating unit:", error)
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Unit number already exists" })
    } else {
      res.status(500).json({ error: "Failed to update unit" })
    }
  }
})

// PATCH /api/units/:id/status - Update unit status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !["vacant", "occupied", "maintenance"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required" })
    }

    const updated = await Unit.updateStatus(req.params.id, status)
    if (!updated) {
      return res.status(404).json({ error: "Unit not found" })
    }

    const updatedUnit = await Unit.getById(req.params.id)
    res.json(updatedUnit)
  } catch (error) {
    console.error("Error updating unit status:", error)
    res.status(500).json({ error: "Failed to update unit status" })
  }
})

// DELETE /api/units/:id - Delete unit
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Unit.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: "Unit not found" })
    }
    res.json({ message: "Unit deleted successfully" })
  } catch (error) {
    console.error("Error deleting unit:", error)
    res.status(500).json({ error: "Failed to delete unit" })
  }
})

export default router
