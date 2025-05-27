"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, FileText, Send, DollarSign, AlertTriangle, Eye } from "lucide-react"
import { invoicesAPI } from "../services/api"
import { formatKSh, formatKShCompact } from "../utils/currency"
import InvoiceModal from "../components/InvoiceModal"
import InvoiceViewModal from "../components/InvoiceViewModal"
import toast from "react-hot-toast"

const statusColors = {
  draft: "bg-gray-100 text-gray-800",
  sent: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-red-100 text-red-800",
}

const statusLabels = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [filteredInvoices, setFilteredInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [filter, setFilter] = useState("all")
  const [stats, setStats] = useState([])

  useEffect(() => {
    fetchInvoices()
    fetchStats()
  }, [])

  useEffect(() => {
    if (filter === "all") {
      setFilteredInvoices(invoices)
    } else {
      setFilteredInvoices(invoices.filter((invoice) => invoice.status === filter))
    }
  }, [filter, invoices])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await invoicesAPI.getAll()
      setInvoices(response.data)
      setFilteredInvoices(response.data)
    } catch (error) {
      console.error("Error fetching invoices:", error)
      toast.error("Failed to load invoices")
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await invoicesAPI.getStats()
      setStats(response.data)
    } catch (error) {
      console.error("Error fetching invoice stats:", error)
    }
  }

  const handleAddInvoice = () => {
    setSelectedInvoice(null)
    setIsModalOpen(true)
  }

  const handleEditInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setIsModalOpen(true)
  }

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice)
    setIsViewModalOpen(true)
  }

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return
    }

    try {
      await invoicesAPI.delete(invoiceId)
      toast.success("Invoice deleted successfully")
      fetchInvoices()
      fetchStats()
    } catch (error) {
      console.error("Error deleting invoice:", error)
      toast.error("Failed to delete invoice")
    }
  }

  const handleStatusChange = async (invoiceId, newStatus) => {
    try {
      await invoicesAPI.updateStatus(invoiceId, newStatus)
      toast.success("Invoice status updated successfully")
      fetchInvoices()
      fetchStats()
    } catch (error) {
      console.error("Error updating invoice status:", error)
      toast.error("Failed to update invoice status")
    }
  }

  const handleMarkAsPaid = async (invoiceId) => {
    try {
      await invoicesAPI.markAsPaid(invoiceId)
      toast.success("Invoice marked as paid")
      fetchInvoices()
      fetchStats()
    } catch (error) {
      console.error("Error marking invoice as paid:", error)
      toast.error("Failed to mark invoice as paid")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedInvoice(null)
  }

  const handleViewModalClose = () => {
    setIsViewModalOpen(false)
    setSelectedInvoice(null)
  }

  const handleModalSuccess = () => {
    fetchInvoices()
    fetchStats()
    handleModalClose()
  }

  const getStatByStatus = (status) => {
    const stat = stats.find((s) => s.status === status)
    return {
      count: stat?.count || 0,
      amount: stat?.total_amount || 0,
    }
  }

  const getDaysOverdue = (dueDate) => {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = now - due
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Manage and track tenant invoices</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={handleAddInvoice} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-blue-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Paid</p>
              <p className="text-lg font-bold text-green-600">{formatKShCompact(getStatByStatus("paid").amount)}</p>
              <p className="text-sm text-gray-500">{getStatByStatus("paid").count} invoices</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <Send className="h-8 w-8 text-blue-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Sent</p>
              <p className="text-lg font-bold text-blue-600">{formatKShCompact(getStatByStatus("sent").amount)}</p>
              <p className="text-sm text-gray-500">{getStatByStatus("sent").count} invoices</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-lg font-bold text-red-600">{formatKShCompact(getStatByStatus("overdue").amount)}</p>
              <p className="text-sm text-gray-500">{getStatByStatus("overdue").count} invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "all" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Invoices
        </button>
        <button
          onClick={() => setFilter("draft")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "draft" ? "bg-gray-100 text-gray-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => setFilter("sent")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "sent" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setFilter("paid")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "paid" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "overdue" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Overdue
        </button>
      </div>

      {/* Invoices Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-row">
                <th className="table-head">Invoice #</th>
                <th className="table-head">Tenant</th>
                <th className="table-head">Unit</th>
                <th className="table-head">Issue Date</th>
                <th className="table-head">Due Date</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Status</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const daysOverdue = getDaysOverdue(invoice.due_date)
                return (
                  <tr key={invoice.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-medium text-blue-600">{invoice.invoice_number}</span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{invoice.tenant_name}</div>
                        <div className="text-sm text-gray-500">{invoice.tenant_email}</div>
                      </div>
                    </td>
                    <td className="table-cell">{invoice.unit_number || "N/A"}</td>
                    <td className="table-cell">{new Date(invoice.issue_date).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <div>
                        <div>{new Date(invoice.due_date).toLocaleDateString()}</div>
                        {invoice.status === "overdue" && daysOverdue > 0 && (
                          <div className="text-xs text-red-600">{daysOverdue} days overdue</div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium">{formatKSh(invoice.total_amount)}</span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}
                      >
                        {statusLabels[invoice.status]}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewInvoice(invoice)}
                          className="btn btn-ghost p-2"
                          title="View Invoice"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleEditInvoice(invoice)}
                          className="btn btn-ghost p-2"
                          title="Edit Invoice"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {invoice.status === "sent" && (
                          <button
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            className="btn btn-ghost p-2 text-green-600 hover:text-green-700"
                            title="Mark as Paid"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(invoice.id)}
                          className="btn btn-ghost p-2 text-red-600 hover:text-red-700"
                          title="Delete Invoice"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredInvoices.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all" ? "Get started by creating your first invoice." : `No ${filter} invoices found.`}
          </p>
          {filter === "all" && (
            <div className="mt-6">
              <button onClick={handleAddInvoice} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Invoice
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <InvoiceModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        invoice={selectedInvoice}
      />

      <InvoiceViewModal
        isOpen={isViewModalOpen}
        onClose={handleViewModalClose}
        invoice={selectedInvoice}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
