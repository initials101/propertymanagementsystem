import express from "express"
import { Invoice } from "../models/Invoice.js"

const router = express.Router()

// GET /api/invoices - Get all invoices
router.get("/", async (req, res) => {
  try {
    const { tenant_id, status } = req.query
    let invoices

    if (tenant_id) {
      invoices = await Invoice.getByTenant(tenant_id)
    } else {
      invoices = await Invoice.getAll()

      // Filter by status if provided
      if (status && status !== "all") {
        invoices = invoices.filter((invoice) => invoice.status === status)
      }
    }

    // Parse line_items JSON for each invoice
    invoices = invoices.map((invoice) => ({
      ...invoice,
      line_items: typeof invoice.line_items === "string" ? JSON.parse(invoice.line_items) : invoice.line_items,
    }))

    res.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    res.status(500).json({ error: "Failed to fetch invoices" })
  }
})

// GET /api/invoices/stats - Get invoice statistics
router.get("/stats", async (req, res) => {
  try {
    const stats = await Invoice.getInvoiceStats()
    res.json(stats)
  } catch (error) {
    console.error("Error fetching invoice stats:", error)
    res.status(500).json({ error: "Failed to fetch invoice stats" })
  }
})

// GET /api/invoices/overdue - Get overdue invoices
router.get("/overdue", async (req, res) => {
  try {
    const overdue = await Invoice.getOverdueInvoices()
    res.json(overdue)
  } catch (error) {
    console.error("Error fetching overdue invoices:", error)
    res.status(500).json({ error: "Failed to fetch overdue invoices" })
  }
})

// GET /api/invoices/generate-number - Generate new invoice number
router.get("/generate-number", async (req, res) => {
  try {
    const invoiceNumber = await Invoice.generateInvoiceNumber()
    res.json({ invoice_number: invoiceNumber })
  } catch (error) {
    console.error("Error generating invoice number:", error)
    res.status(500).json({ error: "Failed to generate invoice number" })
  }
})

// GET /api/invoices/:id - Get invoice by ID
router.get("/:id", async (req, res) => {
  try {
    const invoice = await Invoice.getById(req.params.id)
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    // Parse line_items JSON
    if (typeof invoice.line_items === "string") {
      invoice.line_items = JSON.parse(invoice.line_items)
    }

    res.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    res.status(500).json({ error: "Failed to fetch invoice" })
  }
})

// POST /api/invoices - Create new invoice
router.post("/", async (req, res) => {
  try {
    const {
      tenant_id,
      lease_id,
      issue_date,
      due_date,
      amount,
      tax_amount,
      description,
      line_items,
      payment_terms,
      notes,
      status,
    } = req.body

    if (!tenant_id || !issue_date || !due_date || !amount || !line_items) {
      return res.status(400).json({ error: "Required fields are missing" })
    }

    // Generate invoice number
    const invoice_number = await Invoice.generateInvoiceNumber()

    // Calculate total amount
    const total_amount = (Number.parseFloat(amount) || 0) + (Number.parseFloat(tax_amount) || 0)

    const invoiceId = await Invoice.create({
      invoice_number,
      tenant_id,
      lease_id,
      issue_date,
      due_date,
      amount: Number.parseFloat(amount),
      tax_amount: Number.parseFloat(tax_amount) || 0,
      total_amount,
      description,
      line_items,
      payment_terms,
      notes,
      status,
    })

    const newInvoice = await Invoice.getById(invoiceId)
    res.status(201).json(newInvoice)
  } catch (error) {
    console.error("Error creating invoice:", error)
    res.status(500).json({ error: "Failed to create invoice" })
  }
})

// PUT /api/invoices/:id - Update invoice
router.put("/:id", async (req, res) => {
  try {
    const {
      tenant_id,
      lease_id,
      issue_date,
      due_date,
      amount,
      tax_amount,
      description,
      line_items,
      payment_terms,
      notes,
      status,
    } = req.body

    if (!tenant_id || !issue_date || !due_date || !amount) {
      return res.status(400).json({ error: "Required fields are missing" })
    }

    // Calculate total amount
    const total_amount = (Number.parseFloat(amount) || 0) + (Number.parseFloat(tax_amount) || 0)

    const updated = await Invoice.update(req.params.id, {
      tenant_id,
      lease_id,
      issue_date,
      due_date,
      amount: Number.parseFloat(amount),
      tax_amount: Number.parseFloat(tax_amount) || 0,
      total_amount,
      description,
      line_items,
      payment_terms,
      notes,
      status,
    })

    if (!updated) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    const updatedInvoice = await Invoice.getById(req.params.id)
    res.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    res.status(500).json({ error: "Failed to update invoice" })
  }
})

// PATCH /api/invoices/:id/status - Update invoice status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body

    if (!status || !["draft", "sent", "paid", "overdue", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Valid status is required" })
    }

    const updated = await Invoice.updateStatus(req.params.id, status)
    if (!updated) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    const updatedInvoice = await Invoice.getById(req.params.id)
    res.json(updatedInvoice)
  } catch (error) {
    console.error("Error updating invoice status:", error)
    res.status(500).json({ error: "Failed to update invoice status" })
  }
})

// PATCH /api/invoices/:id/mark-paid - Mark invoice as paid
router.patch("/:id/mark-paid", async (req, res) => {
  try {
    const { payment_id } = req.body

    const updated = await Invoice.markAsPaid(req.params.id, payment_id)
    if (!updated) {
      return res.status(404).json({ error: "Invoice not found" })
    }

    const updatedInvoice = await Invoice.getById(req.params.id)
    res.json(updatedInvoice)
  } catch (error) {
    console.error("Error marking invoice as paid:", error)
    res.status(500).json({ error: "Failed to mark invoice as paid" })
  }
})

// DELETE /api/invoices/:id - Delete invoice
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Invoice.delete(req.params.id)
    if (!deleted) {
      return res.status(404).json({ error: "Invoice not found" })
    }
    res.json({ message: "Invoice deleted successfully" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    res.status(500).json({ error: "Failed to delete invoice" })
  }
})

export default router
