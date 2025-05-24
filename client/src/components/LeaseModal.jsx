"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { leasesAPI, tenantsAPI, unitsAPI } from "../services/api"
import toast from "react-hot-toast"

export default function LeaseModal({ isOpen, onClose, onSuccess, lease }) {
  const [formData, setFormData] = useState({
    tenant_id: "",
    unit_id: "",
    start_date: "",
    end_date: "",
    rent_amount: "",
    security_deposit: "",
    lease_terms: "",
    status: "active",
  })
  const [tenants, setTenants] = useState([])
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  useEffect(() => {
    if (lease) {
      setFormData({
        tenant_id: lease.tenant_id || "",
        unit_id: lease.unit_id || "",
        start_date: lease.start_date ? lease.start_date.split("T")[0] : "",
        end_date: lease.end_date ? lease.end_date.split("T")[0] : "",
        rent_amount: lease.rent_amount || "",
        security_deposit: lease.security_deposit || "",
        lease_terms: lease.lease_terms || "",
        status: lease.status || "active",
      })
    } else {
      setFormData({
        tenant_id: "",
        unit_id: "",
        start_date: "",
        end_date: "",
        rent_amount: "",
        security_deposit: "",
        lease_terms: "",
        status: "active",
      })
    }
  }, [lease])

  const fetchData = async () => {
    try {
      setDataLoading(true)
      const [tenantsResponse, unitsResponse] = await Promise.all([
        tenantsAPI.getAll(),
        lease ? unitsAPI.getAll() : unitsAPI.getVacant(),
      ])
      setTenants(tenantsResponse.data)
      setUnits(unitsResponse.data)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast.error("Failed to load data")
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (
      !formData.tenant_id ||
      !formData.unit_id ||
      !formData.start_date ||
      !formData.end_date ||
      !formData.rent_amount
    ) {
      toast.error("All required fields must be filled")
      return
    }

    try {
      setLoading(true)

      const submitData = {
        ...formData,
        rent_amount: Number.parseFloat(formData.rent_amount),
        security_deposit: formData.security_deposit ? Number.parseFloat(formData.security_deposit) : 0,
      }

      if (lease) {
        await leasesAPI.update(lease.id, submitData)
        toast.success("Lease updated successfully")
      } else {
        await leasesAPI.create(submitData)
        toast.success("Lease created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving lease:", error)
      const message = error.response?.data?.error || "Failed to save lease"
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

  const handleUnitChange = (e) => {
    const unitId = e.target.value
    const selectedUnit = units.find((unit) => unit.id === Number.parseInt(unitId))

    setFormData({
      ...formData,
      unit_id: unitId,
      rent_amount: selectedUnit ? selectedUnit.rent_amount : "",
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">{lease ? "Edit Lease" : "Add New Lease"}</h3>
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
                    onChange={handleChange}
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
                  <label className="block text-sm font-medium text-gray-700">Unit *</label>
                  <select
                    name="unit_id"
                    value={formData.unit_id}
                    onChange={handleUnitChange}
                    required
                    className="select mt-1"
                  >
                    <option value="">Select a unit</option>
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unit_number} - {unit.type.replace("_", " ")} ($
                        {Number.parseFloat(unit.rent_amount).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                    className="input mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    required
                    className="input mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rent Amount *</label>
                  <input
                    type="number"
                    name="rent_amount"
                    value={formData.rent_amount}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="input mt-1"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Security Deposit</label>
                  <input
                    type="number"
                    name="security_deposit"
                    value={formData.security_deposit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="input mt-1"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {lease && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="select mt-1">
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="terminated">Terminated</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Lease Terms</label>
                <textarea
                  name="lease_terms"
                  value={formData.lease_terms}
                  onChange={handleChange}
                  rows={4}
                  className="input mt-1"
                  placeholder="Enter lease terms and conditions"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary">
                  {loading ? "Saving..." : lease ? "Update" : "Create"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
