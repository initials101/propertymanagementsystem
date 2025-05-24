"use client"

import { useState, useEffect } from "react"
import { Download, FileText, DollarSign, Building, AlertTriangle } from "lucide-react"
import { reportsAPI, paymentsAPI } from "../services/api"
import toast from "react-hot-toast"

export default function Reports() {
  const [arrears, setArrears] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadLoading, setDownloadLoading] = useState({})
  const [dateRange, setDateRange] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    fetchArrearsData()
  }, [])

  const fetchArrearsData = async () => {
    try {
      setLoading(true)
      const response = await paymentsAPI.getArrears()
      setArrears(response.data)
    } catch (error) {
      console.error("Error fetching arrears:", error)
      toast.error("Failed to load arrears data")
    } finally {
      setLoading(false)
    }
  }

  const downloadReport = async (reportType, format) => {
    const loadingKey = `${reportType}-${format}`

    try {
      setDownloadLoading((prev) => ({ ...prev, [loadingKey]: true }))

      let response
      let filename

      switch (reportType) {
        case "arrears":
          response = await reportsAPI.downloadArrearsReport(format)
          filename = `arrears-report.${format}`
          break
        case "payments":
          response = await reportsAPI.downloadPaymentHistory(format, dateRange)
          filename = `payment-history.${format}`
          break
        case "occupancy":
          response = await reportsAPI.downloadOccupancyReport(format)
          filename = `occupancy-report.${format}`
          break
        default:
          throw new Error("Invalid report type")
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success("Report downloaded successfully")
    } catch (error) {
      console.error("Error downloading report:", error)
      toast.error("Failed to download report")
    } finally {
      setDownloadLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handleDateRangeChange = (field, value) => {
    setDateRange((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const ReportCard = ({ title, description, icon: Icon, reportType, color }) => (
    <div className="card p-6">
      <div className="flex items-center mb-4">
        <Icon className={`h-8 w-8 ${color}`} />
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex space-x-3">
          <button
            onClick={() => downloadReport(reportType, "pdf")}
            disabled={downloadLoading[`${reportType}-pdf`]}
            className="btn btn-outline flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadLoading[`${reportType}-pdf`] ? "Downloading..." : "Download PDF"}
          </button>
          <button
            onClick={() => downloadReport(reportType, "excel")}
            disabled={downloadLoading[`${reportType}-excel`]}
            className="btn btn-outline flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {downloadLoading[`${reportType}-excel`] ? "Downloading..." : "Download Excel"}
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Generate and download property management reports</p>
      </div>

      {/* Date Range Selector for Payment History */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History Date Range</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={dateRange.start_date}
              onChange={(e) => handleDateRangeChange("start_date", e.target.value)}
              className="input mt-1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={dateRange.end_date}
              onChange={(e) => handleDateRangeChange("end_date", e.target.value)}
              className="input mt-1"
            />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ReportCard
          title="Arrears Report"
          description="View tenants with outstanding payments"
          icon={AlertTriangle}
          reportType="arrears"
          color="text-red-600"
        />

        <ReportCard
          title="Payment History"
          description="Detailed payment records for selected period"
          icon={DollarSign}
          reportType="payments"
          color="text-green-600"
        />

        <ReportCard
          title="Occupancy Report"
          description="Unit occupancy status and tenant information"
          icon={Building}
          reportType="occupancy"
          color="text-blue-600"
        />
      </div>

      {/* Arrears Summary */}
      {arrears.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Arrears Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr className="table-row">
                  <th className="table-head">Tenant</th>
                  <th className="table-head">Unit</th>
                  <th className="table-head">Email</th>
                  <th className="table-head">Phone</th>
                  <th className="table-head">Rent Amount</th>
                  <th className="table-head">Total Paid</th>
                  <th className="table-head">Expected</th>
                  <th className="table-head">Arrears</th>
                </tr>
              </thead>
              <tbody>
                {arrears.map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell font-medium">{item.tenant_name}</td>
                    <td className="table-cell">{item.unit_number}</td>
                    <td className="table-cell">{item.email}</td>
                    <td className="table-cell">{item.phone || "N/A"}</td>
                    <td className="table-cell">${Number.parseFloat(item.rent_amount).toFixed(2)}</td>
                    <td className="table-cell">${Number.parseFloat(item.total_paid).toFixed(2)}</td>
                    <td className="table-cell">${Number.parseFloat(item.expected_amount).toFixed(2)}</td>
                    <td className="table-cell">
                      <span className="text-red-600 font-medium">${Number.parseFloat(item.arrears).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total arrears: {arrears.length} tenant(s)</span>
              <span className="text-lg font-medium text-red-600">
                Total Amount: ${arrears.reduce((sum, item) => sum + Number.parseFloat(item.arrears), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {arrears.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No arrears found</h3>
          <p className="mt-1 text-sm text-gray-500">All tenants are up to date with their payments.</p>
        </div>
      )}
    </div>
  )
}
