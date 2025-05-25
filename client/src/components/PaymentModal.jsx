"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { paymentsAPI, tenantsAPI, leasesAPI } from "../services/api"
import CurrencyInput from "./CurrencyInput"
import { formatKSh } from "../utils/currency"
import toast from "react-hot-toast"

const paymentMethods = [
  { value: "cash", label: "Cash" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "credit_card", label: "Credit Card" },
  { value: "mobile_money", label: "Mobile Money (M-Pesa)" },
]

const paymentTypes = [
  { value: "rent", label: "Rent" },
  { value: "deposit", label: "Deposit" },
  { value: "late_fee", label: "Late Fee" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Other" },
]

const statusOptions = [
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
]

export default function PaymentModal({ isOpen, onClose, onSuccess, payment }) {
  const [formData, setFormData] = useState({
    tenant_id: "",
    lease_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "mobile_money",
    payment_type: "rent",
    description: "",
    status: "completed",
  })
  const [tenants, setTenants] = useState([])
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  useEffect(() => {
    if (payment) {
      setFormData({
        tenant_id: payment.tenant_id || "",
        lease_id: payment.lease_id || "",
        amount: payment.amount || "",
        payment_date: payment.payment_date ? payment.payment_date.split("T")[0] : "",
        payment_method: payment.payment_method || "mobile_money",
        payment_type: payment.payment_type || "rent",
        description: payment.description || "",
        status: payment.status || "completed",
      })
    } else {
      setFormData({
        tenant_id: "",
        lease_id: "",
        amount: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "mobile_money",
        payment_type: "rent",
        description: "",
        status: "completed",
      })
    }
  }, [payment])

  const fetchData = async () => {
    try {
      setDataLoading(true)
      const [tenantsResponse, leasesResponse] = await Promise.all([tenantsAPI.getAll(), leasesAPI.getActive()])
      setTenants(tenantsResponse.data)
      setLeases(leasesResponse.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.tenant_id || !formData.amount || !formData.payment_date) {
      toast.error("Tenant, amount, and payment date are required")
      return
    }

    try {
      setLoading(true)

      const submitData = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
        lease_id: formData.lease_id || null,
      }

      if (payment) {
        await paymentsAPI.update(payment.id, submitData)
        toast.success("Payment updated successfully")
      } else {
        await paymentsAPI.create(submitData)
        toast.success("Payment created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving payment:", error)
      const message = error.response?.data?.error || "Failed to save payment"
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleTenantChange = (e) => {
    const tenantId = e.target.value
    setFormData({
      ...formData,
      tenant_id: tenantId,
      lease_id: "", // Reset lease when tenant changes
    })
  }

  const handleAmountChange = (amount) => {
    setFormData({
      ...formData,
      amount: amount,
    })
  }

  const getFilteredLeases = () => {
    return leases.filter((lease) => lease.tenant_id === Number.parseInt(formData.tenant_id))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">{payment ? "Edit Payment" : "Add New Payment"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {dataLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tenant *</label>
                  <select
                    name="tenant_id"
                    value={formData.tenant_id}
                    onChange={handleTenantChange}
                    required
                    className="select mt-1"
                  >
                    <option value="">Select a tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} - {tenant.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Lease (Optional)</label>
                  <select name="lease_id" value={formData.lease_id} onChange={handleChange} className="select mt-1">
                    <option value="">Select a lease</option>
                    {getFilteredLeases().map((lease) => (
                      <option key={lease.id} value={lease.id}>
                        {lease.unit_number} - {formatKSh(lease.rent_amount)}/month
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount (KSh) *</label>
                  <CurrencyInput
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0.00"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Date *</label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleChange}
                    required
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleChange}
                    className="select mt-1"
                  >
                    {paymentMethods.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                  <select
                    name="payment_type"
                    value={formData.payment_type}
                    onChange={handleChange}
                    className="select mt-1"
                  >
                    {paymentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="select mt-1">
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="input mt-1"
                  placeholder="Enter payment description (e.g., M-Pesa transaction ID)"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Saving..." : payment ? "Update" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
