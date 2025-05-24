import express from "express"
import PDFDocument from "pdfkit"
import ExcelJS from "exceljs"
import { Payment } from "../models/Payment.js"
import { Unit } from "../models/Unit.js"
import { Lease } from "../models/Lease.js"

const router = express.Router()

// GET /api/reports/arrears/pdf - Generate arrears report PDF
router.get("/arrears/pdf", async (req, res) => {
  try {
    const arrears = await Payment.getArrearsReport()

    const doc = new PDFDocument()
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="arrears-report.pdf"')

    doc.pipe(res)

    // Header
    doc.fontSize(20).text("Arrears Report", 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)

    // Table headers
    let y = 120
    doc
      .fontSize(10)
      .text("Tenant Name", 50, y)
      .text("Unit", 150, y)
      .text("Email", 200, y)
      .text("Phone", 300, y)
      .text("Arrears", 400, y)

    y += 20
    doc.moveTo(50, y).lineTo(500, y).stroke()
    y += 10

    // Data rows
    arrears.forEach((item) => {
      if (y > 700) {
        doc.addPage()
        y = 50
      }

      doc
        .text(item.tenant_name, 50, y)
        .text(item.unit_number, 150, y)
        .text(item.email, 200, y)
        .text(item.phone || "N/A", 300, y)
        .text(`$${Number.parseFloat(item.arrears).toFixed(2)}`, 400, y)

      y += 20
    })

    doc.end()
  } catch (error) {
    console.error("Error generating arrears PDF:", error)
    res.status(500).json({ error: "Failed to generate arrears report" })
  }
})

// GET /api/reports/arrears/excel - Generate arrears report Excel
router.get("/arrears/excel", async (req, res) => {
  try {
    const arrears = await Payment.getArrearsReport()

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Arrears Report")

    // Headers
    worksheet.columns = [
      { header: "Tenant Name", key: "tenant_name", width: 20 },
      { header: "Unit Number", key: "unit_number", width: 15 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Rent Amount", key: "rent_amount", width: 15 },
      { header: "Total Paid", key: "total_paid", width: 15 },
      { header: "Expected Amount", key: "expected_amount", width: 15 },
      { header: "Arrears", key: "arrears", width: 15 },
    ]

    // Data
    arrears.forEach((item) => {
      worksheet.addRow({
        tenant_name: item.tenant_name,
        unit_number: item.unit_number,
        email: item.email,
        phone: item.phone,
        rent_amount: Number.parseFloat(item.rent_amount),
        total_paid: Number.parseFloat(item.total_paid),
        expected_amount: Number.parseFloat(item.expected_amount),
        arrears: Number.parseFloat(item.arrears),
      })
    })

    // Style headers
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="arrears-report.xlsx"')

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error generating arrears Excel:", error)
    res.status(500).json({ error: "Failed to generate arrears report" })
  }
})

// GET /api/reports/payments/pdf - Generate payment history PDF
router.get("/payments/pdf", async (req, res) => {
  try {
    const { start_date, end_date } = req.query
    const payments =
      start_date && end_date ? await Payment.getPaymentHistory(start_date, end_date) : await Payment.getAll()

    const doc = new PDFDocument()
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="payment-history.pdf"')

    doc.pipe(res)

    // Header
    doc.fontSize(20).text("Payment History Report", 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)
    if (start_date && end_date) {
      doc.text(`Period: ${start_date} to ${end_date}`, 50, 100)
    }

    // Table headers
    let y = 140
    doc
      .fontSize(10)
      .text("Date", 50, y)
      .text("Tenant", 120, y)
      .text("Unit", 220, y)
      .text("Amount", 270, y)
      .text("Method", 330, y)
      .text("Type", 400, y)

    y += 20
    doc.moveTo(50, y).lineTo(500, y).stroke()
    y += 10

    // Data rows
    payments.forEach((payment) => {
      if (y > 700) {
        doc.addPage()
        y = 50
      }

      doc
        .text(new Date(payment.payment_date).toLocaleDateString(), 50, y)
        .text(payment.tenant_name, 120, y)
        .text(payment.unit_number || "N/A", 220, y)
        .text(`$${Number.parseFloat(payment.amount).toFixed(2)}`, 270, y)
        .text(payment.payment_method, 330, y)
        .text(payment.payment_type, 400, y)

      y += 20
    })

    doc.end()
  } catch (error) {
    console.error("Error generating payment history PDF:", error)
    res.status(500).json({ error: "Failed to generate payment history report" })
  }
})

// GET /api/reports/payments/excel - Generate payment history Excel
router.get("/payments/excel", async (req, res) => {
  try {
    const { start_date, end_date } = req.query
    const payments =
      start_date && end_date ? await Payment.getPaymentHistory(start_date, end_date) : await Payment.getAll()

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Payment History")

    // Headers
    worksheet.columns = [
      { header: "Payment Date", key: "payment_date", width: 15 },
      { header: "Tenant Name", key: "tenant_name", width: 20 },
      { header: "Unit Number", key: "unit_number", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Payment Method", key: "payment_method", width: 15 },
      { header: "Payment Type", key: "payment_type", width: 15 },
      { header: "Description", key: "description", width: 30 },
      { header: "Status", key: "status", width: 15 },
    ]

    // Data
    payments.forEach((payment) => {
      worksheet.addRow({
        payment_date: new Date(payment.payment_date),
        tenant_name: payment.tenant_name,
        unit_number: payment.unit_number,
        amount: Number.parseFloat(payment.amount),
        payment_method: payment.payment_method,
        payment_type: payment.payment_type,
        description: payment.description,
        status: payment.status,
      })
    })

    // Style headers
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="payment-history.xlsx"')

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error generating payment history Excel:", error)
    res.status(500).json({ error: "Failed to generate payment history report" })
  }
})

// GET /api/reports/occupancy/pdf - Generate occupancy report PDF
router.get("/occupancy/pdf", async (req, res) => {
  try {
    const stats = await Unit.getOccupancyStats()
    const units = await Unit.getAll()
    const activeLeases = await Lease.getActiveLeases()

    const doc = new PDFDocument()
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="occupancy-report.pdf"')

    doc.pipe(res)

    // Header
    doc.fontSize(20).text("Occupancy Report", 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)

    // Summary statistics
    let y = 120
    doc.fontSize(16).text("Summary", 50, y)
    y += 30

    stats.forEach((stat) => {
      doc
        .fontSize(12)
        .text(
          `${stat.status.charAt(0).toUpperCase() + stat.status.slice(1)}: ${stat.count} units (${stat.percentage}%)`,
          50,
          y,
        )
      y += 20
    })

    y += 20
    doc.fontSize(16).text("Unit Details", 50, y)
    y += 30

    // Table headers
    doc
      .fontSize(10)
      .text("Unit", 50, y)
      .text("Type", 120, y)
      .text("Rent", 200, y)
      .text("Status", 270, y)
      .text("Tenant", 340, y)

    y += 20
    doc.moveTo(50, y).lineTo(500, y).stroke()
    y += 10

    // Unit data
    units.forEach((unit) => {
      if (y > 700) {
        doc.addPage()
        y = 50
      }

      doc
        .text(unit.unit_number, 50, y)
        .text(unit.type.replace("_", " "), 120, y)
        .text(`$${Number.parseFloat(unit.rent_amount).toFixed(2)}`, 200, y)
        .text(unit.status, 270, y)
        .text(unit.tenant_name || "Vacant", 340, y)

      y += 20
    })

    doc.end()
  } catch (error) {
    console.error("Error generating occupancy PDF:", error)
    res.status(500).json({ error: "Failed to generate occupancy report" })
  }
})

// GET /api/reports/occupancy/excel - Generate occupancy report Excel
router.get("/occupancy/excel", async (req, res) => {
  try {
    const units = await Unit.getAll()

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Occupancy Report")

    // Headers
    worksheet.columns = [
      { header: "Unit Number", key: "unit_number", width: 15 },
      { header: "Type", key: "type", width: 15 },
      { header: "Rent Amount", key: "rent_amount", width: 15 },
      { header: "Status", key: "status", width: 15 },
      { header: "Tenant Name", key: "tenant_name", width: 20 },
      { header: "Tenant Email", key: "tenant_email", width: 25 },
      { header: "Lease Start", key: "start_date", width: 15 },
      { header: "Lease End", key: "end_date", width: 15 },
    ]

    // Data
    units.forEach((unit) => {
      worksheet.addRow({
        unit_number: unit.unit_number,
        type: unit.type.replace("_", " "),
        rent_amount: Number.parseFloat(unit.rent_amount),
        status: unit.status,
        tenant_name: unit.tenant_name || "Vacant",
        tenant_email: unit.tenant_email || "",
        start_date: unit.start_date ? new Date(unit.start_date) : "",
        end_date: unit.end_date ? new Date(unit.end_date) : "",
      })
    })

    // Style headers
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE0E0E0" },
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", 'attachment; filename="occupancy-report.xlsx"')

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Error generating occupancy Excel:", error)
    res.status(500).json({ error: "Failed to generate occupancy report" })
  }
})

export default router
