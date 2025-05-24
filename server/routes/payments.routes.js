import express from "express"
import { Payment } from "../models/Payment.js"

const router = express.Router()

// GET /api/payments - Get all payments
router.get("/", async (req, res) => {
  try {
    const { tenant_id, start_date, end_date } = req.query
    let payments

    if (tenant_id) {
      payments = await Payment.getByTenant(tenant_id)
    } else if (start_date && end_date) {
      payments = await Payment.getPaymentHistory(start_date, end_date)
    } else {
      payments = await Payment.getAll()
    }

    res.json(payments)
  } catch (error) {
    console.error("Error fetching payments:", error)
    res.status(500).json({ error: "Failed to fetch payments" })
  }
})

// GET /api/payments/stats - Get payment statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await Payment.getMonthlyStats()
    res.json(stats)
  } catch (error) {
    console.error("Error fetching payment stats:", error)
    res.status(500).json({ error: "Failed to fetch payment stats" })
  }
})

// GET /api/payments/arrears - Get arrears report
router.get("/arrears", async (req, res) => {
  try {
    const arrears = await Payment.getArrearsReport()
    res.json(arrears)
  } catch (error) {
    console.error("Error fetching arrears report:", error)
    res.status(500).json({ error: "Failed to fetch arrears report" })
  }
})

// GET /api/payments/:id - Get payment by ID
router.get("/:id", async (req, res) => {
  try {
    const payment = await Payment.getById(req.params.id)
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" })
    }
    res.json(payment)
  } catch (error) {
    console.error("Error fetching payment:", error)
    res.status(500).json({ error: "Failed to fetch payment" })
  }
})

// POST /api/payments - Create new payment
router.post("/", async (req, res) => {
  try {
    const { tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status } = req.body

    if (!tenant_id || !amount || !payment_date || !payment_method) {
      return res.status(400).json({ error: "Tenant ID, amount, payment date, and payment method are required" })
    }

    const paymentId = await Payment.create({
      tenant_id,
      lease_id,
      amount,
      payment_date,
      payment_method,
      payment_type: payment_type || "rent",
      description,
      status,
    })

    const newPayment = await Payment.getById(paymentId)
    res.status(201).json(newPayment)
  } catch (error) {
    console.error("Error creating payment:", error)
    res.status(500).json({ error: "Failed to create payment" })
  }
})

// PUT /api/payments/:id - Update payment
router.put("/:id", async (req, res) => {
  try {
    const { tenant_id, lease_id, amount, payment_date, payment_method, payment_type, description, status } = req.body

    if (!tenant_id || !amount || !payment_date || !payment_method) {
      return res.status(400).json({ error: "Tenant ID, amount, payment date, and payment method are required" })
    }

    const updated = await Payment.update(req.params.id, {
      tenant_id,
      lease_id,
      amount,
      payment_date,
      payment_method,
      payment_type,
      description,
      status,
    })

    if (!updated) {
      return res.status(404).json({ error: "Payment not found" })
    }

    const updatedPayment = await Payment.getById(req.params.id)
    res.json(updatedPayment)
  } catch (error) {
    console.error("Error updating payment:", error)
    res.status(500).json({ error: "Failed to update payment" })
  }
})

// DELETE /api/payments/:id - Delete payment
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Payment.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: "Payment not found" })
    }
    res.json({ message: "Payment deleted successfully" })
  } catch (error) {
    console.error("Error deleting payment:", error)
    res.status(500).json({ error: "Failed to delete payment" })
  }
})

export default router
