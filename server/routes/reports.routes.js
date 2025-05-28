import express from "express"
import PDFDocument from "pdfkit"
import ExcelJS from "exceljs"
import { Payment } from "../models/Payment.js"
import { Unit } from "../models/Unit.js"
import { Lease } from "../models/Lease.js"

const router = express.Router()

// Helper function to format currency in KSh
const formatKSh = (amount) => {
  if (!amount && amount !== 0) return "KSh 0.00"
  return `KSh ${Number.parseFloat(amount).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// Helper function to format currency for compact display
const formatKShCompact = (amount) => {
  if (!amount && amount !== 0) return "KSh 0"
  const num = Number.parseFloat(amount)
  if (num % 1 === 0) {
    return `KSh ${num.toLocaleString("en-KE")}`
  }
  return `KSh ${num.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

// GET /api/reports/arrears/pdf - Generate arrears report PDF
router.get("/arrears/pdf", async (req, res) => {
  try {
    const arrears = await Payment.getArrearsReport()

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="arrears-report.pdf"')

    doc.pipe(res)

    // Header
    doc.fontSize(20).text("Arrears Report", 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)
    doc.fontSize(10).text("All amounts are in Kenyan Shillings (KSh)", 50, 100)

    // Table headers with better spacing
    let y = 140
    const colWidths = {
      name: 120,
      unit: 60,
      email: 140,
      phone: 80,
      arrears: 80,
    }

    let x = 50
    doc.fontSize(10).font("Helvetica-Bold")
    doc.text("Tenant Name", x, y, { width: colWidths.name })
    x += colWidths.name
    doc.text("Unit", x, y, { width: colWidths.unit })
    x += colWidths.unit
    doc.text("Email", x, y, { width: colWidths.email })
    x += colWidths.email
    doc.text("Phone", x, y, { width: colWidths.phone })
    x += colWidths.phone
    doc.text("Arrears", x, y, { width: colWidths.arrears })

    y += 20
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 10

    // Data rows
    doc.font("Helvetica")
    let totalArrears = 0

    arrears.forEach((item) => {
      if (y > 720) {
        doc.addPage()
        y = 50

        // Repeat headers on new page
        x = 50
        doc.fontSize(10).font("Helvetica-Bold")
        doc.text("Tenant Name", x, y, { width: colWidths.name })
        x += colWidths.name
        doc.text("Unit", x, y, { width: colWidths.unit })
        x += colWidths.unit
        doc.text("Email", x, y, { width: colWidths.email })
        x += colWidths.email
        doc.text("Phone", x, y, { width: colWidths.phone })
        x += colWidths.phone
        doc.text("Arrears", x, y, { width: colWidths.arrears })

        y += 20
        doc.moveTo(50, y).lineTo(550, y).stroke()
        y += 10
        doc.font("Helvetica")
      }

      x = 50
      const arrearAmount = Number.parseFloat(item.arrears)
      totalArrears += arrearAmount

      doc.fontSize(9)
      doc.text(item.tenant_name || "N/A", x, y, { width: colWidths.name, ellipsis: true })
      x += colWidths.name
      doc.text(item.unit_number || "N/A", x, y, { width: colWidths.unit })
      x += colWidths.unit
      doc.text(item.email || "N/A", x, y, { width: colWidths.email, ellipsis: true })
      x += colWidths.email
      doc.text(item.phone || "N/A", x, y, { width: colWidths.phone })
      x += colWidths.phone
      doc.text(formatKShCompact(arrearAmount), x, y, { width: colWidths.arrears })

      y += 18
    })

    // Summary section
    y += 20
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 15

    doc.fontSize(12).font("Helvetica-Bold")
    doc.text(`Total Tenants with Outstanding Rent: ${arrears.length}`, 50, y)
    y += 20
    doc.text(`Total Outstanding Amount: ${formatKSh(totalArrears)}`, 50, y)
    y += 15
    doc.fontSize(10).font("Helvetica")
    doc.text("Note: Arrears calculated based on current month's rent vs payments received", 50, y)

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
      { header: "Tenant Name", key: "tenant_name", width: 25 },
      { header: "Unit Number", key: "unit_number", width: 15 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Monthly Rent (KSh)", key: "rent_amount", width: 18 },
      { header: "Paid This Month (KSh)", key: "total_paid", width: 20 },
      { header: "Expected (KSh)", key: "expected_amount", width: 18 },
      { header: "Outstanding (KSh)", key: "arrears", width: 18 },
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

    // Format currency columns
    const currencyColumns = ["E", "F", "G", "H"] // rent_amount, total_paid, expected_amount, arrears
    currencyColumns.forEach((col) => {
      worksheet.getColumn(col).numFmt = '"KSh "#,##0.00'
    })

    // Add summary row
    const summaryRow = worksheet.addRow({})
    summaryRow.getCell(7).value = "Total Outstanding:"
    summaryRow.getCell(8).value = arrears.reduce((sum, item) => sum + Number.parseFloat(item.arrears), 0)
    summaryRow.font = { bold: true }

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

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="payment-history.pdf"')

    doc.pipe(res)

    // Header
    doc.fontSize(20).text("Payment History Report", 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)
    if (start_date && end_date) {
      doc.text(`Period: ${start_date} to ${end_date}`, 50, 100)
    }
    doc.fontSize(10).text("All amounts are in Kenyan Shillings (KSh)", 50, 120)

    // Table headers with better spacing
    let y = 160
    const colWidths = {
      date: 80,
      tenant: 120,
      unit: 60,
      amount: 80,
      method: 80,
      type: 70,
    }

    let x = 50
    doc.fontSize(10).font("Helvetica-Bold")
    doc.text("Date", x, y, { width: colWidths.date })
    x += colWidths.date
    doc.text("Tenant", x, y, { width: colWidths.tenant })
    x += colWidths.tenant
    doc.text("Unit", x, y, { width: colWidths.unit })
    x += colWidths.unit
    doc.text("Amount", x, y, { width: colWidths.amount })
    x += colWidths.amount
    doc.text("Method", x, y, { width: colWidths.method })
    x += colWidths.method
    doc.text("Type", x, y, { width: colWidths.type })

    y += 20
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 10

    // Data rows
    doc.font("Helvetica")
    let totalAmount = 0

    payments.forEach((payment) => {
      if (y > 720) {
        doc.addPage()
        y = 50

        // Repeat headers on new page
        x = 50
        doc.fontSize(10).font("Helvetica-Bold")
        doc.text("Date", x, y, { width: colWidths.date })
        x += colWidths.date
        doc.text("Tenant", x, y, { width: colWidths.tenant })
        x += colWidths.tenant
        doc.text("Unit", x, y, { width: colWidths.unit })
        x += colWidths.unit
        doc.text("Amount", x, y, { width: colWidths.amount })
        x += colWidths.amount
        doc.text("Method", x, y, { width: colWidths.method })
        x += colWidths.method
        doc.text("Type", x, y, { width: colWidths.type })

        y += 20
        doc.moveTo(50, y).lineTo(550, y).stroke()
        y += 10
        doc.font("Helvetica")
      }

      x = 50
      const paymentAmount = Number.parseFloat(payment.amount)
      totalAmount += paymentAmount

      doc.fontSize(9)
      doc.text(new Date(payment.payment_date).toLocaleDateString(), x, y, { width: colWidths.date })
      x += colWidths.date
      doc.text(payment.tenant_name || "N/A", x, y, { width: colWidths.tenant, ellipsis: true })
      x += colWidths.tenant
      doc.text(payment.unit_number || "N/A", x, y, { width: colWidths.unit })
      x += colWidths.unit
      doc.text(formatKShCompact(paymentAmount), x, y, { width: colWidths.amount })
      x += colWidths.amount
      doc.text(payment.payment_method?.replace("_", " ") || "N/A", x, y, { width: colWidths.method, ellipsis: true })
      x += colWidths.method
      doc.text(payment.payment_type || "N/A", x, y, { width: colWidths.type })

      y += 18
    })

    // Summary section
    y += 20
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 15

    doc.fontSize(12).font("Helvetica-Bold")
    doc.text(`Total Payments: ${payments.length}`, 50, y)
    y += 20
    doc.text(`Total Amount: ${formatKSh(totalAmount)}`, 50, y)

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
      { header: "Tenant Name", key: "tenant_name", width: 25 },
      { header: "Unit Number", key: "unit_number", width: 15 },
      { header: "Amount (KSh)", key: "amount", width: 15 },
      { header: "Payment Method", key: "payment_method", width: 18 },
      { header: "Payment Type", key: "payment_type", width: 15 },
      { header: "Description", key: "description", width: 35 },
      { header: "Status", key: "status", width: 12 },
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

    // Format currency column
    worksheet.getColumn("D").numFmt = '"KSh "#,##0.00'

    // Add summary row
    const summaryRow = worksheet.addRow({})
    summaryRow.getCell(3).value = "Total:"
    summaryRow.getCell(4).value = payments.reduce((sum, payment) => sum + Number.parseFloat(payment.amount), 0)
    summaryRow.font = { bold: true }

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

    const doc = new PDFDocument({ margin: 50 })
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="occupancy-report.pdf"')

    doc.pipe(res)

    // Header
    doc.fontSize(20).text("Occupancy Report", 50, 50)
    doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80)
    doc.fontSize(10).text("All amounts are in Kenyan Shillings (KSh)", 50, 100)

    // Summary statistics
    let y = 140
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

    // Table headers with better spacing
    const colWidths = {
      unit: 60,
      type: 80,
      rent: 80,
      status: 70,
      tenant: 120,
    }

    let x = 50
    doc.fontSize(10).font("Helvetica-Bold")
    doc.text("Unit", x, y, { width: colWidths.unit })
    x += colWidths.unit
    doc.text("Type", x, y, { width: colWidths.type })
    x += colWidths.type
    doc.text("Rent", x, y, { width: colWidths.rent })
    x += colWidths.rent
    doc.text("Status", x, y, { width: colWidths.status })
    x += colWidths.status
    doc.text("Tenant", x, y, { width: colWidths.tenant })

    y += 20
    doc.moveTo(50, y).lineTo(550, y).stroke()
    y += 10

    // Unit data
    doc.font("Helvetica")
    units.forEach((unit) => {
      if (y > 720) {
        doc.addPage()
        y = 50

        // Repeat headers on new page
        x = 50
        doc.fontSize(10).font("Helvetica-Bold")
        doc.text("Unit", x, y, { width: colWidths.unit })
        x += colWidths.unit
        doc.text("Type", x, y, { width: colWidths.type })
        x += colWidths.type
        doc.text("Rent", x, y, { width: colWidths.rent })
        x += colWidths.rent
        doc.text("Status", x, y, { width: colWidths.status })
        x += colWidths.status
        doc.text("Tenant", x, y, { width: colWidths.tenant })

        y += 20
        doc.moveTo(50, y).lineTo(550, y).stroke()
        y += 10
        doc.font("Helvetica")
      }

      x = 50
      doc.fontSize(9)
      doc.text(unit.unit_number, x, y, { width: colWidths.unit })
      x += colWidths.unit
      doc.text(unit.type.replace("_", " "), x, y, { width: colWidths.type })
      x += colWidths.type
      doc.text(formatKShCompact(unit.rent_amount), x, y, { width: colWidths.rent })
      x += colWidths.rent
      doc.text(unit.status, x, y, { width: colWidths.status })
      x += colWidths.status
      doc.text(unit.tenant_name || "Vacant", x, y, { width: colWidths.tenant, ellipsis: true })

      y += 18
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
      { header: "Rent Amount (KSh)", key: "rent_amount", width: 18 },
      { header: "Status", key: "status", width: 15 },
      { header: "Tenant Name", key: "tenant_name", width: 25 },
      { header: "Tenant Email", key: "tenant_email", width: 30 },
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

    // Format currency column
    worksheet.getColumn("C").numFmt = '"KSh "#,##0.00'

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
