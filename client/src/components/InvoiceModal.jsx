"use client"

import { useState, useEffect } from "react"
import { X, Plus, Trash2 } from "lucide-react"
import { invoicesAPI, tenantsAPI, leasesAPI } from "../services/api"
import CurrencyInput from "./CurrencyInput"
import { formatKSh } from "../utils/currency"
import toast from "react-hot-toast"

export default function InvoiceModal({ isOpen, onClose, onSuccess, invoice }) {
  const [formData, setFormData] = useState({
    tenant_id: "",
    lease_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    description: "",
    payment_terms: "Due within 5 days",
    notes: "",
    status: "draft",
  })
  const [lineItems, setLineItems] = useState([{ description: "", quantity: 1, rate: "", amount: "" }])
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
    if (invoice) {
      setFormData({
        tenant_id: invoice.tenant_id || "",
        lease_id: invoice.lease_id || "",
        issue_date: invoice.issue_date ? invoice.issue_date.split("T")[0] : "",
        due_date: invoice.due_date ? invoice.due_date.split("T")[0] : "",
        description: invoice.description || "",
        payment_terms: invoice.payment_terms || "Due within 5 days",
        notes: invoice.notes || "",
        status: invoice.status || "draft",
      })

      // Set line items
      if (invoice.line_items && invoice.line_items.items) {
        setLineItems(invoice.line_items.items)
      } else {
        setLineItems([{ description: "", quantity: 1, rate: "", amount: "" }])
      }
    } else {
      setFormData({
        tenant_id: "",
        lease_id: "",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: "",
        description: "",
        payment_terms: "Due within 5 days",
        notes: "",
        status: "draft",
      })
      setLineItems([{ description: "", quantity: 1, rate: "", amount: "" }])
    }
  }, [invoice])

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

    if (!formData.tenant_id || !formData.issue_date || !formData.due_date) {
      toast.error("Tenant, issue date, and due date are required")
      return
    }

    // Validate line items
    const validLineItems = lineItems.filter((item) => item.description && item.rate)
    if (validLineItems.length === 0) {
      toast.error("At least one line item is required")
      return
    }

    try {
      setLoading(true)

      // Calculate totals
      const amount = validLineItems.reduce((sum, item) => sum + Number.parseFloat(item.amount || 0), 0)
      const tax_amount = 0 // Can be implemented later
      const total_amount = amount + tax_amount

      const submitData = {
        ...formData,
        amount,
        tax_amount,
        total_amount,
        line_items: { items: validLineItems },
      }

      if (invoice) {
        await invoicesAPI.update(invoice.id, submitData)
        toast.success("Invoice updated successfully")
      } else {
        await invoicesAPI.create(submitData)
        toast.success("Invoice created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving invoice:", error)
      const message = error.response?.data?.error || "Failed to save invoice"
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

  const handleLeaseChange = (e) => {
    const leaseId = e.target.value
    const selectedLease = leases.find((lease) => lease.id === Number.parseInt(leaseId))

    setFormData({
      ...formData,
      lease_id: leaseId,
    })

    // Auto-populate line item with rent if lease is selected
    if (selectedLease && lineItems.length === 1 && !lineItems[0].description) {
      const newLineItems = [
        {
          description: `Monthly Rent - Unit ${selectedLease.unit_number}`,
          quantity: 1,
          rate: selectedLease.rent_amount,
          amount: selectedLease.rent_amount,
        },
      ]
      setLineItems(newLineItems)
    }
  }

  const handleLineItemChange = (index, field, value) => {
    const newLineItems = [...lineItems]
    newLineItems[index][field] = value

    // Calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const quantity = Number.parseFloat(newLineItems[index].quantity) || 0
      const rate = Number.parseFloat(newLineItems[index].rate) || 0
      newLineItems[index].amount = quantity * rate
    }

    setLineItems(newLineItems)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, rate: "", amount: "" }])
  }

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      const newLineItems = lineItems.filter((_, i) => i !== index)
      setLineItems(newLineItems)
    }
  }

  const getFilteredLeases = () => {
    return leases.filter((lease) => lease.tenant_id === Number.parseInt(formData.tenant_id))
  }

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (Number.parseFloat(item.amount) || 0), 0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">{invoice ? "Edit Invoice" : "Create New Invoice"}</h3>
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
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
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
                  <select
                    name="lease_id"
                    value={formData.lease_id}
                    onChange={handleLeaseChange}
                    className="select mt-1"
                  >
                    <option value="">Select a lease</option>
                    {getFilteredLeases().map((lease) => (
                      <option key={lease.id} value={lease.id}>
                        {lease.unit_number} - {formatKSh(lease.rent_amount)}/month
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date *</label>
                  <input
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    required
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date *</label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="select mt-1">
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input mt-1"
                  placeholder="Invoice description"
                />
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Line Items</h4>
                  <button type="button" onClick={addLineItem} className="btn btn-outline btn-sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-4">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleLineItemChange(index, "description", e.target.value)}
                          className="input mt-1"
                          placeholder="Item description"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Qty</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleLineItemChange(index, "quantity", e.target.value)}
                          className="input mt-1"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Rate (KSh)</label>
                        <CurrencyInput
                          value={item.rate}
                          onChange={(value) => handleLineItemChange(index, "rate", value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded-md text-sm font-medium">
                          {formatKSh(item.amount || 0)}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="btn btn-ghost p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-end">
                    <div className="text-right">
                      <div className="text-lg font-medium">Total: {formatKSh(calculateTotal())}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Terms</label>
                  <input
                    type="text"
                    name="payment_terms"
                    value={formData.payment_terms}
                    onChange={handleChange}
                    className="input mt-1"
                    placeholder="e.g., Due within 5 days"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="input mt-1"
                  placeholder="Additional notes or terms"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
