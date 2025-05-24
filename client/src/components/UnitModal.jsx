"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { unitsAPI } from "../services/api"
import toast from "react-hot-toast"

const unitTypes = [
  { value: "studio", label: "Studio" },
  { value: "one_bedroom", label: "1 Bedroom" },
  { value: "two_bedroom", label: "2 Bedroom" },
  { value: "three_bedroom", label: "3 Bedroom" },
  { value: "house", label: "House" },
]

const statusOptions = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied", label: "Occupied" },
  { value: "maintenance", label: "Maintenance" },
]

export default function UnitModal({ isOpen, onClose, onSuccess, unit }) {
  const [formData, setFormData] = useState({
    unit_number: "",
    type: "one_bedroom",
    rent_amount: "",
    status: "vacant",
    description: "",
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (unit) {
      setFormData({
        unit_number: unit.unit_number || "",
        type: unit.type || "one_bedroom",
        rent_amount: unit.rent_amount || "",
        status: unit.status || "vacant",
        description: unit.description || "",
      })
    } else {
      setFormData({
        unit_number: "",
        type: "one_bedroom",
        rent_amount: "",
        status: "vacant",
        description: "",
      })
    }
  }, [unit])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.unit_number || !formData.rent_amount) {
      toast.error("Unit number and rent amount are required")
      return
    }

    try {
      setLoading(true)

      const submitData = {
        ...formData,
        rent_amount: Number.parseFloat(formData.rent_amount),
      }

      if (unit) {
        await unitsAPI.update(unit.id, submitData)
        toast.success("Unit updated successfully")
      } else {
        await unitsAPI.create(submitData)
        toast.success("Unit created successfully")
      }

      onSuccess()
    } catch (error) {
      console.error("Error saving unit:", error)
      const message = error.response?.data?.error || "Failed to save unit"
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h3 className="text-lg font-medium text-gray-900">{unit ? "Edit Unit" : "Add New Unit"}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Unit Number *</label>
              <input
                type="text"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleChange}
                required
                className="input mt-1"
                placeholder="e.g., A101, 2B, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select name="type" value={formData.type} onChange={handleChange} required className="select mt-1">
                {unitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

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
                placeholder="Enter unit description"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "Saving..." : unit ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
