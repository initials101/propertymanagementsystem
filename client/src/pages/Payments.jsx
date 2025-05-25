"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DollarSign, Search } from "lucide-react"
import { paymentsAPI } from "../services/api"
import { formatKSh, formatKShCompact } from "../utils/currency"
import PaymentModal from "../components/PaymentModal"
import toast from "react-hot-toast"

const paymentTypeColors = {
  rent: "bg-green-100 text-green-800",
  deposit: "bg-blue-100 text-blue-800",
  late_fee: "bg-red-100 text-red-800",
  maintenance: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
}

const statusColors = {
  completed: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
}

export default function Payments() {
  const [payments, setPayments] = useState([])
  const [filteredPayments, setFilteredPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchPayments()
  }, [])

  useEffect(() => {
    let filtered = payments

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.unit_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Apply type filter
    if (filter !== "all") {
      filtered = filtered.filter((payment) => payment.payment_type === filter)
    }

    setFilteredPayments(filtered)
  }, [searchTerm, filter, payments])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentsAPI.getAll()
      setPayments(response.data)
      setFilteredPayments(response.data)
    } catch (error) {
      console.error("Error fetching payments:", error)
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }

  const handleAddPayment = () => {
    setSelectedPayment(null)
    setIsModalOpen(true)
  }

  const handleEditPayment = (payment) => {
    setSelectedPayment(payment)
    setIsModalOpen(true)
  }

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return
    }

    try {
      await paymentsAPI.delete(paymentId)
      toast.success("Payment deleted successfully")
      fetchPayments()
    } catch (error) {
      console.error("Error deleting payment:", error)
      toast.error("Failed to delete payment")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedPayment(null)
  }

  const handleModalSuccess = () => {
    fetchPayments()
    handleModalClose()
  }

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + Number.parseFloat(payment.amount), 0)

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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">Track and manage tenant payments</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={handleAddPayment} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search payments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select">
          <option value="all">All Types</option>
          <option value="rent">Rent</option>
          <option value="deposit">Deposit</option>
          <option value="late_fee">Late Fee</option>
          <option value="maintenance">Maintenance</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Summary */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Payment Summary</h3>
            <p className="text-sm text-gray-500">
              {filteredPayments.length} payment(s) {filter !== "all" && `(${filter} only)`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-600">{formatKShCompact(totalAmount)}</p>
            <p className="text-sm text-gray-500">Total Amount</p>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-row">
                <th className="table-head">Date</th>
                <th className="table-head">Tenant</th>
                <th className="table-head">Unit</th>
                <th className="table-head">Amount</th>
                <th className="table-head">Type</th>
                <th className="table-head">Method</th>
                <th className="table-head">Status</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="table-row">
                  <td className="table-cell">{new Date(payment.payment_date).toLocaleDateString()}</td>
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{payment.tenant_name}</div>
                      <div className="text-sm text-gray-500">{payment.tenant_email}</div>
                    </div>
                  </td>
                  <td className="table-cell">{payment.unit_number || "N/A"}</td>
                  <td className="table-cell">
                    <span className="font-medium text-green-600">{formatKSh(payment.amount)}</span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        paymentTypeColors[payment.payment_type]
                      }`}
                    >
                      {payment.payment_type.replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell">{payment.payment_method.replace("_", " ")}</td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        statusColors[payment.status]
                      }`}
                    >
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditPayment(payment)} className="btn btn-ghost p-2">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(payment.id)}
                        className="btn btn-ghost p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && !loading && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filter !== "all"
              ? "Try adjusting your search or filter."
              : "Get started by adding a new payment."}
          </p>
          {!searchTerm && filter === "all" && (
            <div className="mt-6">
              <button onClick={handleAddPayment} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <PaymentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        payment={selectedPayment}
      />
    </div>
  )
}
