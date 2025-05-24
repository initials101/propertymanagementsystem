import { query } from '../config/db.js';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

// Generate arrears report (tenants with overdue payments)
export const generateArrearsReport = async (req, res) => {
  try {
    const { format } = req.params;
    
    // Get tenants with active leases who have payments due
    const arrearsData = await query(`
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.email,
        t.phone,
        u.unit_number,
        l.rent_amount,
        l.start_date,
        l.end_date,
        DATEDIFF(CURDATE(), l.start_date) % 30 as days_since_last_due,
        (
          SELECT SUM(amount)
          FROM payments p
          WHERE p.tenant_id = t.id
          AND p.payment_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
          AND p.payment_date <= LAST_DAY(CURDATE())
        ) as current_month_payments
      FROM tenants t
      JOIN leases l ON t.id = l.tenant_id
      JOIN units u ON l.unit_id = u.id
      WHERE l.status = 'active'
      HAVING current_month_payments IS NULL OR current_month_payments < l.rent_amount
      ORDER BY tenant_name
    `);
    
    if (format === 'pdf') {
      return generateArrearsPDF(res, arrearsData);
    } else if (format === 'excel') {
      return generateArrearsExcel(res, arrearsData);
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate payment history report
export const generatePaymentHistoryReport = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.params;
    
    // Get payment history for the specified date range
    const paymentData = await query(`
      SELECT 
        p.id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.reference_number,
        p.status,
        t.name as tenant_name,
        u.unit_number
      FROM payments p
      JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN leases l ON p.lease_id = l.id
      LEFT JOIN units u ON l.unit_id = u.id
      WHERE p.payment_date BETWEEN ? AND ?
      ORDER BY p.payment_date DESC
    `, [startDate, endDate]);
    
    if (format === 'pdf') {
      return generatePaymentHistoryPDF(res, paymentData, startDate, endDate);
    } else if (format === 'excel') {
      return generatePaymentHistoryExcel(res, paymentData, startDate, endDate);
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate occupancy report
export const generateOccupancyReport = async (req, res) => {
  try {
    const { format } = req.params;
    
    // Get unit occupancy data
    const unitData = await query(`
      SELECT 
        u.id,
        u.unit_number,
        u.type,
        u.square_feet,
        u.bedrooms,
        u.bathrooms,
        u.rent_amount,
        u.status,
        t.name as tenant_name,
        l.start_date,
        l.end_date
      FROM units u
      LEFT JOIN leases l ON u.id = l.unit_id AND l.status = 'active'
      LEFT JOIN tenants t ON l.tenant_id = t.id
      ORDER BY u.unit_number
    `);
    
    // Get occupancy statistics
    const [occupancyStats] = await query(`
      SELECT 
        COUNT(*) as total_units,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) as occupied_units,
        SUM(CASE WHEN status = 'vacant' THEN 1 ELSE 0 END) as vacant_units,
        ROUND((SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as occupancy_rate,
        SUM(rent_amount) as potential_income,
        SUM(CASE WHEN status = 'occupied' THEN rent_amount ELSE 0 END) as actual_income
      FROM units
    `);
    
    if (format === 'pdf') {
      return generateOccupancyPDF(res, unitData, occupancyStats);
    } else if (format === 'excel') {
      return generateOccupancyExcel(res, unitData, occupancyStats);
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate income report
export const generateIncomeReport = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.params;
    
    // Get income data for the specified period
    const incomeData = await query(`
      SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') as month,
        SUM(amount) as total_amount,
        COUNT(*) as payment_count
      FROM payments
      WHERE payment_date BETWEEN ? AND ?
      GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
      ORDER BY month
    `, [startDate, endDate]);
    
    // Get payment method breakdown
    const paymentMethodData = await query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        ROUND((COUNT(*) / (SELECT COUNT(*) FROM payments WHERE payment_date BETWEEN ? AND ?)) * 100, 2) as percentage
      FROM payments
      WHERE payment_date BETWEEN ? AND ?
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `, [startDate, endDate, startDate, endDate]);
    
    if (format === 'pdf') {
      return generateIncomePDF(res, incomeData, paymentMethodData, startDate, endDate);
    } else if (format === 'excel') {
      return generateIncomeExcel(res, incomeData, paymentMethodData, startDate, endDate);
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate lease expiration report
export const generateLeaseExpirationReport = async (req, res) => {
  try {
    const { format } = req.params;
    
    // Get all active leases with their expiration dates
    const leaseData = await query(`
      SELECT 
        l.id,
        l.start_date,
        l.end_date,
        l.rent_amount,
        DATEDIFF(l.end_date, CURDATE()) as days_remaining,
        t.name as tenant_name,
        t.email,
        t.phone,
        u.unit_number,
        u.type
      FROM leases l
      JOIN tenants t ON l.tenant_id = t.id
      JOIN units u ON l.unit_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.end_date ASC
    `);
    
    if (format === 'pdf') {
      return generateLeaseExpirationPDF(res, leaseData);
    } else if (format === 'excel') {
      return generateLeaseExpirationExcel(res, leaseData);
    } else {
      res.status(400).json({ message: 'Invalid format. Use pdf or excel.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PDF Generators
const generateArrearsPDF = (res, data) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=arrears_report_${new Date().toISOString().split('T')[0]}.pdf`);
  
  doc.pipe(res);
  
  // Title
  doc.fontSize(20).text('Tenant Arrears Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  if (data.length === 0) {
    doc.fontSize(14).text('No tenants currently in arrears.', { align: 'center' });
  } else {
    // Summary
    doc.fontSize(14).text(`Total Tenants in Arrears: ${data.length}`, { align: 'left' });
    doc.moveDown(2);
    
    // Table headers
    const tableTop = doc.y;
    const tableHeaders = ['Tenant Name', 'Unit', 'Rent Amount', 'Paid This Month', 'Balance Due'];
    const columnWidths = [150, 80, 90, 100, 90];
    
    let currentX = doc.x;
    
    tableHeaders.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, tableTop, { width: columnWidths[i] });
      currentX += columnWidths[i];
    });
    
    doc.moveDown();
    doc.font('Helvetica');
    
    // Table rows
    data.forEach((tenant, i) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(14).text('Tenant Arrears Report (Continued)', { align: 'center' });
        doc.moveDown(2);
        
        // Repeat headers on new page
        currentX = doc.x;
        tableHeaders.forEach((header, j) => {
          doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, doc.y, { width: columnWidths[j] });
          currentX += columnWidths[j];
        });
        doc.moveDown();
        doc.font('Helvetica');
      }
      
      const paidAmount = tenant.current_month_payments || 0;
      const balanceDue = tenant.rent_amount - paidAmount;
      
      currentX = doc.x;
      doc.fontSize(9).text(tenant.tenant_name, currentX, doc.y, { width: columnWidths[0] });
      currentX += columnWidths[0];
      doc.text(tenant.unit_number, currentX, doc.y, { width: columnWidths[1] });
      currentX += columnWidths[1];
      doc.text(`$${tenant.rent_amount.toFixed(2)}`, currentX, doc.y, { width: columnWidths[2] });
      currentX += columnWidths[2];
      doc.text(`$${paidAmount.toFixed(2)}`, currentX, doc.y, { width: columnWidths[3] });
      currentX += columnWidths[3];
      doc.text(`$${balanceDue.toFixed(2)}`, currentX, doc.y, { width: columnWidths[4] });
      
      doc.moveDown();
    });
  }
  
  // Finalize
  doc.end();
};

const generatePaymentHistoryPDF = (res, data, startDate, endDate) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=payment_history_${startDate}_to_${endDate}.pdf`);
  
  doc.pipe(res);
  
  // Title
  doc.fontSize(20).text('Payment History Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  if (data.length === 0) {
    doc.fontSize(14).text('No payments recorded during this period.', { align: 'center' });
  } else {
    // Summary
    const totalAmount = data.reduce((sum, payment) => sum + payment.amount, 0);
    doc.fontSize(14).text(`Total Payments: ${data.length}`, { align: 'left' });
    doc.fontSize(14).text(`Total Amount: $${totalAmount.toFixed(2)}`, { align: 'left' });
    doc.moveDown(2);
    
    // Table headers
    const tableTop = doc.y;
    const tableHeaders = ['Date', 'Tenant', 'Unit', 'Amount', 'Method', 'Status'];
    const columnWidths = [80, 120, 80, 80, 80, 80];
    
    let currentX = doc.x;
    
    tableHeaders.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, tableTop, { width: columnWidths[i] });
      currentX += columnWidths[i];
    });
    
    doc.moveDown();
    doc.font('Helvetica');
    
    // Table rows
    data.forEach((payment) => {
      if (doc.y > 700) {
        doc.addPage();
        doc.fontSize(14).text('Payment History Report (Continued)', { align: 'center' });
        doc.moveDown(2);
        
        // Repeat headers on new page
        currentX = doc.x;
        tableHeaders.forEach((header, j) => {
          doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, doc.y, { width: columnWidths[j] });
          currentX += columnWidths[j];
        });
        doc.moveDown();
        doc.font('Helvetica');
      }
      
      const paymentDate = new Date(payment.payment_date).toLocaleDateString();
      
      currentX = doc.x;
      doc.fontSize(9).text(paymentDate, currentX, doc.y, { width: columnWidths[0] });
      currentX += columnWidths[0];
      doc.text(payment.tenant_name, currentX, doc.y, { width: columnWidths[1] });
      currentX += columnWidths[1];
      doc.text(payment.unit_number || 'N/A', currentX, doc.y, { width: columnWidths[2] });
      currentX += columnWidths[2];
      doc.text(`$${payment.amount.toFixed(2)}`, currentX, doc.y, { width: columnWidths[3] });
      currentX += columnWidths[3];
      doc.text(payment.payment_method, currentX, doc.y, { width: columnWidths[4] });
      currentX += columnWidths[4];
      doc.text(payment.status, currentX, doc.y, { width: columnWidths[5] });
      
      doc.moveDown();
    });
  }
  
  // Finalize
  doc.end();
};

const generateOccupancyPDF = (res, unitData, stats) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=occupancy_report_${new Date().toISOString().split('T')[0]}.pdf`);
  
  doc.pipe(res);
  
  // Title
  doc.fontSize(20).text('Occupancy Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  // Summary statistics
  doc.fontSize(14).text('Occupancy Summary', { align: 'left' });
  doc.moveDown();
  doc.fontSize(12).text(`Total Units: ${stats.total_units}`, { align: 'left' });
  doc.fontSize(12).text(`Occupied Units: ${stats.occupied_units}`, { align: 'left' });
  doc.fontSize(12).text(`Vacant Units: ${stats.vacant_units}`, { align: 'left' });
  doc.fontSize(12).text(`Occupancy Rate: ${stats.occupancy_rate}%`, { align: 'left' });
  doc.fontSize(12).text(`Potential Monthly Income: $${stats.potential_income.toFixed(2)}`, { align: 'left' });
  doc.fontSize(12).text(`Actual Monthly Income: $${stats.actual_income.toFixed(2)}`, { align: 'left' });
  doc.moveDown(2);
  
  // Unit details
  doc.fontSize(14).text('Unit Details', { align: 'left' });
  doc.moveDown();
  
  // Table headers
  const tableTop = doc.y;
  const tableHeaders = ['Unit', 'Type', 'Status', 'Rent', 'Tenant', 'Lease End'];
  const columnWidths = [60, 80, 70, 70, 120, 80];
  
  let currentX = doc.x;
  
  tableHeaders.forEach((header, i) => {
    doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, tableTop, { width: columnWidths[i] });
    currentX += columnWidths[i];
  });
  
  doc.moveDown();
  doc.font('Helvetica');
  
  // Table rows
  unitData.forEach((unit) => {
    if (doc.y > 700) {
      doc.addPage();
      doc.fontSize(14).text('Occupancy Report (Continued)', { align: 'center' });
      doc.moveDown(2);
      
      // Repeat headers on new page
      currentX = doc.x;
      tableHeaders.forEach((header, j) => {
        doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, doc.y, { width: columnWidths[j] });
        currentX += columnWidths[j];
      });
      doc.moveDown();
      doc.font('Helvetica');
    }
    
    const leaseEnd = unit.end_date ? new Date(unit.end_date).toLocaleDateString() : 'N/A';
    
    currentX = doc.x;
    doc.fontSize(9).text(unit.unit_number, currentX, doc.y, { width: columnWidths[0] });
    currentX += columnWidths[0];
    doc.text(unit.type, currentX, doc.y, { width: columnWidths[1] });
    currentX += columnWidths[1];
    doc.text(unit.status, currentX, doc.y, { width: columnWidths[2] });
    currentX += columnWidths[2];
    doc.text(`$${unit.rent_amount.toFixed(2)}`, currentX, doc.y, { width: columnWidths[3] });
    currentX += columnWidths[3];
    doc.text(unit.tenant_name || 'Vacant', currentX, doc.y, { width: columnWidths[4] });
    currentX += columnWidths[4];
    doc.text(leaseEnd, currentX, doc.y, { width: columnWidths[5] });
    
    doc.moveDown();
  });
  
  // Finalize
  doc.end();
};

const generateIncomePDF = (res, incomeData, paymentMethodData, startDate, endDate) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=income_report_${startDate}_to_${endDate}.pdf`);
  
  doc.pipe(res);
  
  // Title
  doc.fontSize(20).text('Income Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  if (incomeData.length === 0) {
    doc.fontSize(14).text('No income recorded during this period.', { align: 'center' });
  } else {
    // Summary
    const totalIncome = incomeData.reduce((sum, month) => sum + month.total_amount, 0);
    const totalPayments = incomeData.reduce((sum, month) => sum + month.payment_count, 0);
    doc.fontSize(14).text(`Total Income: $${totalIncome.toFixed(2)}`, { align: 'left' });
    doc.fontSize(14).text(`Total Payments: ${totalPayments}`, { align: 'left' });
    doc.moveDown(2);
    
    // Monthly breakdown
    doc.fontSize(14).text('Monthly Income Breakdown', { align: 'left' });
    doc.moveDown();
    
    // Table headers
    const tableTop = doc.y;
    const monthHeaders = ['Month', 'Total Amount', 'Number of Payments', 'Average Payment'];
    const monthWidths = [100, 120, 120, 120];
    
    let currentX = doc.x;
    
    monthHeaders.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, tableTop, { width: monthWidths[i] });
      currentX += monthWidths[i];
    });
    
    doc.moveDown();
    doc.font('Helvetica');
    
    // Table rows
    incomeData.forEach((month) => {
      const avgPayment = month.total_amount / month.payment_count;
      
      currentX = doc.x;
      doc.fontSize(9).text(month.month, currentX, doc.y, { width: monthWidths[0] });
      currentX += monthWidths[0];
      doc.text(`$${month.total_amount.toFixed(2)}`, currentX, doc.y, { width: monthWidths[1] });
      currentX += monthWidths[1];
      doc.text(month.payment_count.toString(), currentX, doc.y, { width: monthWidths[2] });
      currentX += monthWidths[2];
      doc.text(`$${avgPayment.toFixed(2)}`, currentX, doc.y, { width: monthWidths[3] });
      
      doc.moveDown();
    });
    
    doc.moveDown(2);
    
    // Payment method breakdown
    doc.fontSize(14).text('Payment Method Breakdown', { align: 'left' });
    doc.moveDown();
    
    // Table headers
    const methodTop = doc.y;
    const methodHeaders = ['Payment Method', 'Count', 'Total Amount', 'Percentage'];
    const methodWidths = [120, 80, 120, 100];
    
    currentX = doc.x;
    
    methodHeaders.forEach((header, i) => {
      doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, methodTop, { width: methodWidths[i] });
      currentX += methodWidths[i];
    });
    
    doc.moveDown();
    doc.font('Helvetica');
    
    // Table rows
    paymentMethodData.forEach((method) => {
      currentX = doc.x;
      doc.fontSize(9).text(method.payment_method, currentX, doc.y, { width: methodWidths[0] });
      currentX += methodWidths[0];
      doc.text(method.count.toString(), currentX, doc.y, { width: methodWidths[1] });
      currentX += methodWidths[1];
      doc.text(`$${method.total_amount.toFixed(2)}`, currentX, doc.y, { width: methodWidths[2] });
      currentX += methodWidths[2];
      doc.text(`${method.percentage}%`, currentX, doc.y, { width: methodWidths[3] });
      
      doc.moveDown();
    });
  }
  
  // Finalize
  doc.end();
};

const generateLeaseExpirationPDF = (res, leaseData) => {
  const doc = new PDFDocument({ margin: 50 });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=lease_expiration_report_${new Date().toISOString().split('T')[0]}.pdf`);
  
  doc.pipe(res);
  
  // Title
  doc.fontSize(20).text('Lease Expiration Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);
  
  if (leaseData.length === 0) {
    doc.fontSize(14).text('No active leases found.', { align: 'center' });
  } else {
    // Group leases by expiration timeframe
    const expiringSoon = leaseData.filter(lease => lease.days_remaining <= 30 && lease.days_remaining >= 0);
    const expiring1to3Months = leaseData.filter(lease => lease.days_remaining > 30 && lease.days_remaining <= 90);
    const expiringLater = leaseData.filter(lease => lease.days_remaining > 90);
    const expired = leaseData.filter(lease => lease.days_remaining < 0);
    
    // Summary
    doc.fontSize(14).text(`Total Active Leases: ${leaseData.length}`, { align: 'left' });
    doc.fontSize(14).text(`Expired Leases: ${expired.length}`, { align: 'left' });
    doc.fontSize(14).text(`Expiring within 30 days: ${expiringSoon.length}`, { align: 'left' });
    doc.fontSize(14).text(`Expiring in 1-3 months: ${expiring1to3Months.length}`, { align: 'left' });
    doc.fontSize(14).text(`Expiring after 3 months: ${expiringLater.length}`, { align: 'left' });
    doc.moveDown(2);
    
    // Table function for reuse
    const createLeaseTable = (leases, title) => {
      if (leases.length === 0) return;
      
      doc.fontSize(14).text(title, { align: 'left' });
      doc.moveDown();
      
      // Table headers
      const tableTop = doc.y;
      const tableHeaders = ['Unit', 'Tenant', 'End Date', 'Days Left', 'Rent'];
      const columnWidths = [80, 140, 90, 80, 80];
      
      let currentX = doc.x;
      
      tableHeaders.forEach((header, i) => {
        doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, tableTop, { width: columnWidths[i] });
        currentX += columnWidths[i];
      });
      
      doc.moveDown();
      doc.font('Helvetica');
      
      // Table rows
      leases.forEach((lease) => {
        if (doc.y > 700) {
          doc.addPage();
          doc.fontSize(14).text(`${title} (Continued)`, { align: 'center' });
          doc.moveDown(2);
          
          // Repeat headers on new page
          currentX = doc.x;
          tableHeaders.forEach((header, j) => {
            doc.fontSize(10).font('Helvetica-Bold').text(header, currentX, doc.y, { width: columnWidths[j] });
            currentX += columnWidths[j];
          });
          doc.moveDown();
          doc.font('Helvetica');
        }
        
        const endDate = new Date(lease.end_date).toLocaleDateString();
        
        currentX = doc.x;
        doc.fontSize(9).text(lease.unit_number, currentX, doc.y, { width: columnWidths[0] });
        currentX += columnWidths[0];
        doc.text(lease.tenant_name, currentX, doc.y, { width: columnWidths[1] });
        currentX += columnWidths[1];
        doc.text(endDate, currentX, doc.y, { width: columnWidths[2] });
        currentX += columnWidths[2];
        doc.text(lease.days_remaining.toString(), currentX, doc.y, { width: columnWidths[3] });
        currentX += columnWidths[3];
        doc.text(`$${lease.rent_amount.toFixed(2)}`, currentX, doc.y, { width: columnWidths[4] });
        
        doc.moveDown();
      });
      
      doc.moveDown(2);
    };
    
    // Create tables for each group
    if (expired.length > 0) {
      createLeaseTable(expired, 'Expired Leases');
    }
    
    if (expiringSoon.length > 0) {
      createLeaseTable(expiringSoon, 'Leases Expiring Within 30 Days');
    }
    
    if (expiring1to3Months.length > 0) {
      createLeaseTable(expiring1to3Months, 'Leases Expiring in 1-3 Months');
    }
    
    if (expiringLater.length > 0) {
      createLeaseTable(expiringLater, 'Leases Expiring After 3 Months');
    }
  }
  
  // Finalize
  doc.end();
};

// Excel Generators
const generateArrearsExcel = async (res, data) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Arrears Report');
  
  // Add title
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'Tenant Arrears Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add summary
  worksheet.getCell('A4').value = `Total Tenants in Arrears: ${data.length}`;
  worksheet.getCell('A4').font = { bold: true };
  
  // Add headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow([
    'Tenant Name', 
    'Unit', 
    'Rent Amount', 
    'Paid This Month', 
    'Balance Due'
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add data
  data.forEach((tenant) => {
    const paidAmount = tenant.current_month_payments || 0;
    const balanceDue = tenant.rent_amount - paidAmount;
    
    worksheet.addRow([
      tenant.tenant_name,
      tenant.unit_number,
      tenant.rent_amount,
      paidAmount,
      balanceDue
    ]);
  });
  
  // Format columns
  worksheet.getColumn(3).numFmt = '$#,##0.00';
  worksheet.getColumn(4).numFmt = '$#,##0.00';
  worksheet.getColumn(5).numFmt = '$#,##0.00';
  
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });
  
  // Send the workbook
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=arrears_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
};

const generatePaymentHistoryExcel = async (res, data, startDate, endDate) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Payment History');
  
  // Add title
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'Payment History Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Period: ${startDate} to ${endDate}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A3:F3');
  worksheet.getCell('A3').value = `Generated on: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  
  // Add summary
  const totalAmount = data.reduce((sum, payment) => sum + payment.amount, 0);
  worksheet.getCell('A5').value = `Total Payments: ${data.length}`;
  worksheet.getCell('A5').font = { bold: true };
  
  worksheet.getCell('A6').value = `Total Amount: $${totalAmount.toFixed(2)}`;
  worksheet.getCell('A6').font = { bold: true };
  
  // Add headers
  worksheet.addRow([]);
  const headerRow = worksheet.addRow([
    'Date', 
    'Tenant', 
    'Unit', 
    'Amount', 
    'Method', 
    'Status'
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add data
  data.forEach((payment) => {
    worksheet.addRow([
      new Date(payment.payment_date),
      payment.tenant_name,
      payment.unit_number || 'N/A',
      payment.amount,
      payment.payment_method,
      payment.status
    ]);
  });
  
  // Format columns
  worksheet.getColumn(1).numFmt = 'mm/dd/yyyy';
  worksheet.getColumn(4).numFmt = '$#,##0.00';
  
  worksheet.columns.forEach((column) => {
    column.width = 18;
  });
  
  // Send the workbook
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=payment_history_${startDate}_to_${endDate}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
};

const generateOccupancyExcel = async (res, unitData, stats) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Occupancy Report');
  
  // Add title
  worksheet.mergeCells('A1:F1');
  worksheet.getCell('A1').value = 'Occupancy Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:F2');
  worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Add summary
  worksheet.getCell('A4').value = 'Occupancy Summary';
  worksheet.getCell('A4').font = { size: 14, bold: true };
  
  worksheet.getCell('A5').value = `Total Units:`;
  worksheet.getCell('B5').value = stats.total_units;
  
  worksheet.getCell('A6').value = `Occupied Units:`;
  worksheet.getCell('B6').value = stats.occupied_units;
  
  worksheet.getCell('A7').value = `Vacant Units:`;
  worksheet.getCell('B7').value = stats.vacant_units;
  
  worksheet.getCell('A8').value = `Occupancy Rate:`;
  worksheet.getCell('B8').value = `${stats.occupancy_rate}%`;
  
  worksheet.getCell('A9').value = `Potential Monthly Income:`;
  worksheet.getCell('B9').value = stats.potential_income;
  worksheet.getCell('B9').numFmt = '$#,##0.00';
  
  worksheet.getCell('A10').value = `Actual Monthly Income:`;
  worksheet.getCell('B10').value = stats.actual_income;
  worksheet.getCell('B10').numFmt = '$#,##0.00';
  
  // Add unit details
  worksheet.getCell('A12').value = 'Unit Details';
  worksheet.getCell('A12').font = { size: 14, bold: true };
  
  // Add headers
  const headerRow = worksheet.addRow([
    'Unit', 
    'Type', 
    'Status', 
    'Rent', 
    'Tenant', 
    'Lease End'
  ]);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add data
  unitData.forEach((unit) => {
    worksheet.addRow([
      unit.unit_number,
      unit.type,
      unit.status,
      unit.rent_amount,
      unit.tenant_name || 'Vacant',
      unit.end_date ? new Date(unit.end_date) : 'N/A'
    ]);
  });
  
  // Format columns
  worksheet.getColumn(4).numFmt = '$#,##0.00';
  worksheet.getColumn(6).numFmt = 'mm/dd/yyyy';
  
  worksheet.columns.forEach((column) => {
    column.width = 18;
  });
  
  // Send the workbook
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=occupancy_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
};

const generateIncomeExcel = async (res, incomeData, paymentMethodData, startDate, endDate) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Income Report');
  
  // Add title
  worksheet.mergeCells('A1:D1');
  worksheet.getCell('A1').value = 'Income Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:D2');
  worksheet.getCell('A2').value = `Period: ${startDate} to ${endDate}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A3:D3');
  worksheet.getCell('A3').value = `Generated on: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A3').alignment = { horizontal: 'center' };
  
  // Add summary
  const totalIncome = incomeData.reduce((sum, month) => sum + month.total_amount, 0);
  const totalPayments = incomeData.reduce((sum, month) => sum + month.payment_count, 0);
  
  worksheet.getCell('A5').value = `Total Income:`;
  worksheet.getCell('B5').value = totalIncome;
  worksheet.getCell('B5').numFmt = '$#,##0.00';
  
  worksheet.getCell('A6').value = `Total Payments:`;
  worksheet.getCell('B6').value = totalPayments;
  
  // Monthly breakdown
  worksheet.getCell('A8').value = 'Monthly Income Breakdown';
  worksheet.getCell('A8').font = { size: 14, bold: true };
  
  // Add headers
  const monthHeaderRow = worksheet.addRow([
    'Month', 
    'Total Amount', 
    'Number of Payments', 
    'Average Payment'
  ]);
  monthHeaderRow.font = { bold: true };
  monthHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add monthly data
  incomeData.forEach((month) => {
    const avgPayment = month.total_amount / month.payment_count;
    
    worksheet.addRow([
      month.month,
      month.total_amount,
      month.payment_count,
      avgPayment
    ]);
  });
  
  // Format columns
  worksheet.getColumn(2).numFmt = '$#,##0.00';
  worksheet.getColumn(4).numFmt = '$#,##0.00';
  
  // Payment method breakdown
  worksheet.addRow([]);
  worksheet.addRow([]);
  const methodCell = worksheet.addRow(['Payment Method Breakdown']).getCell(1);
  methodCell.font = { size: 14, bold: true };
  
  // Add headers
  const methodHeaderRow = worksheet.addRow([
    'Payment Method', 
    'Count', 
    'Total Amount', 
    'Percentage'
  ]);
  methodHeaderRow.font = { bold: true };
  methodHeaderRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });
  
  // Add payment method data
  paymentMethodData.forEach((method) => {
    worksheet.addRow([
      method.payment_method,
      method.count,
      method.total_amount,
      `${method.percentage}%`
    ]);
  });
  
  // Format columns
  worksheet.getColumn(3).numFmt = '$#,##0.00';
  
  worksheet.columns.forEach((column) => {
    column.width = 20;
  });
  
  // Send the workbook
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=income_report_${startDate}_to_${endDate}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
};

const generateLeaseExpirationExcel = async (res, leaseData) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Lease Expiration Report');
  
  // Add title
  worksheet.mergeCells('A1:E1');
  worksheet.getCell('A1').value = 'Lease Expiration Report';
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.getCell('A1').alignment = { horizontal: 'center' };
  
  worksheet.mergeCells('A2:E2');
  worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString()}`;
  worksheet.getCell('A2').alignment = { horizontal: 'center' };
  
  // Group leases by expiration timeframe
  const expiringSoon = leaseData.filter(lease => lease.days_remaining <= 30 && lease.days_remaining >= 0);
  const expiring1to3Months = leaseData.filter(lease => lease.days_remaining > 30 && lease.days_remaining <= 90);
  const expiringLater = leaseData.filter(lease => lease.days_remaining > 90);
  const expired = leaseData.filter(lease => lease.days_remaining < 0);
  
  // Add summary
  worksheet.getCell('A4').value = `Total Active Leases:`;
  worksheet.getCell('B4').value = leaseData.length;
  
  worksheet.getCell('A5').value = `Expired Leases:`;
  worksheet.getCell('B5').value = expired.length;
  
  worksheet.getCell('A6').value = `Expiring within 30 days:`;
  worksheet.getCell('B6').value = expiringSoon.length;
  
  worksheet.getCell('A7').value = `Expiring in 1-3 months:`;
  worksheet.getCell('B7').value = expiring1to3Months.length;
  
  worksheet.getCell('A8').value = `Expiring after 3 months:`;
  worksheet.getCell('B8').value = expiringLater.length;
  
  // Create worksheet for each category
  const addLeaseWorksheet = (leases, title) => {
    if (leases.length === 0) return;
    
    const sheet = workbook.addWorksheet(title);
    
    // Add headers
    const headerRow = sheet.addRow([
      'Unit', 
      'Tenant', 
      'End Date', 
      'Days Left', 
      'Rent'
    ]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    // Add data
    leases.forEach((lease) => {
      sheet.addRow([
        lease.unit_number,
        lease.tenant_name,
        new Date(lease.end_date),
        lease.days_remaining,
        lease.rent_amount
      ]);
    });
    
    // Format columns
    sheet.getColumn(3).numFmt = 'mm/dd/yyyy';
    sheet.getColumn(5).numFmt = '$#,##0.00';
    
    sheet.columns.forEach((column) => {
      column.width = 18;
    });
  };
  
  // Add worksheets for each category
  if (expired.length > 0) {
    addLeaseWorksheet(expired, 'Expired Leases');
  }
  
  if (expiringSoon.length > 0) {
    addLeaseWorksheet(expiringSoon, 'Expiring 30 Days');
  }
  
  if (expiring1to3Months.length > 0) {
    addLeaseWorksheet(expiring1to3Months, 'Expiring 1-3 Months');
  }
  
  if (expiringLater.length > 0) {
    addLeaseWorksheet(expiringLater, 'Expiring Later');
  }
  
  // Send the workbook
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=lease_expiration_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  
  await workbook.xlsx.write(res);
  res.end();
};