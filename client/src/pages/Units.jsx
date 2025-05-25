"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Building, Users } from "lucide-react"
import { unitsAPI } from "../services/api"
import { formatKSh } from "../utils/currency"
import UnitModal from "../components/UnitModal"
import toast from "react-hot-toast"

const statusColors = {
  vacant: "bg-yellow-100 text-yellow-800",
  occupied: "bg-green-100 text-green-800",
  maintenance: "bg-red-100 text-red-800",
}

const typeLabels = {
  studio: "Studio",
  one_bedroom: "1 Bedroom",
  two_bedroom: "2 Bedroom",
  three_bedroom: "3 Bedroom",
  house: "House",
}

export default function Units() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      setLoading(true)
      const response = await unitsAPI.getAll()
      setUnits(response.data)
    } catch (error) {
      console.error("Error fetching units:", error)
      toast.error("Failed to load units")
    } finally {
      setLoading(false)
    }
  }

  const handleAddUnit = () => {
    setSelectedUnit(null)
    setIsModalOpen(true)
  }

  const handleEditUnit = (unit) => {
    setSelectedUnit(unit)
    setIsModalOpen(true)
  }

  const handleDeleteUnit = async (unitId) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) {
      return
    }

    try {
      await unitsAPI.delete(unitId)
      toast.success("Unit deleted successfully")
      fetchUnits()
    } catch (error) {
      console.error("Error deleting unit:", error)
      toast.error("Failed to delete unit")
    }
  }

  const handleStatusChange = async (unitId, newStatus) => {
    try {
      await unitsAPI.updateStatus(unitId, newStatus)
      toast.success("Unit status updated successfully")
      fetchUnits()
    } catch (error) {
      console.error("Error updating unit status:", error)
      toast.error("Failed to update unit status")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedUnit(null)
  }

  const handleModalSuccess = () => {
    fetchUnits()
    handleModalClose()
  }

  const filteredUnits = units.filter((unit) => {
    if (filter === "all") return true
    return unit.status === filter
  })

  const stats = {
    total: units.length,
    vacant: units.filter((u) => u.status === "vacant").length,
    occupied: units.filter((u) => u.status === "occupied").length,
    maintenance: units.filter((u) => u.status === "maintenance").length,
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
          <h1 className="text-2xl font-bold text-gray-900">Units</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your property units</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={handleAddUnit} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="card p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-blue-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Total Units</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Occupied</p>
              <p className="text-2xl font-bold text-gray-900">{stats.occupied}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-yellow-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Vacant</p>
              <p className="text-2xl font-bold text-gray-900">{stats.vacant}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center">
            <Building className="h-8 w-8 text-red-600" />
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">Maintenance</p>
              <p className="text-2xl font-bold text-gray-900">{stats.maintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex space-x-4">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "all" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          All Units
        </button>
        <button
          onClick={() => setFilter("vacant")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "vacant" ? "bg-yellow-100 text-yellow-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Vacant
        </button>
        <button
          onClick={() => setFilter("occupied")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "occupied" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Occupied
        </button>
        <button
          onClick={() => setFilter("maintenance")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "maintenance" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Maintenance
        </button>
      </div>

      {/* Units Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredUnits.map((unit) => (
          <div key={unit.id} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Unit {unit.unit_number}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[unit.status]}`}
              >
                {unit.status.charAt(0).toUpperCase() + unit.status.slice(1)}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {typeLabels[unit.type]}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Rent:</span> {formatKSh(unit.rent_amount)}/month
              </p>
              {unit.tenant_name && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tenant:</span> {unit.tenant_name}
                </p>
              )}
              {unit.description && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Description:</span> {unit.description}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <button onClick={() => handleEditUnit(unit)} className="btn btn-ghost p-2">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteUnit(unit.id)}
                  className="btn btn-ghost p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <select
                value={unit.status}
                onChange={(e) => handleStatusChange(unit.id, e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {filteredUnits.length === 0 && !loading && (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No units found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all" ? "Get started by adding a new unit." : `No ${filter} units found.`}
          </p>
          {filter === "all" && (
            <div className="mt-6">
              <button onClick={handleAddUnit} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Unit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <UnitModal isOpen={isModalOpen} onClose={handleModalClose} onSuccess={handleModalSuccess} unit={selectedUnit} />
    </div>
  )
}
