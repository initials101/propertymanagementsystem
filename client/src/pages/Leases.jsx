"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, FileText, AlertTriangle } from "lucide-react"
import { leasesAPI } from "../services/api"
import { formatKSh } from "../utils/currency"
import LeaseModal from "../components/LeaseModal"
import toast from "react-hot-toast"

const statusColors = {
  active: "bg-green-100 text-green-800",
  expired: "bg-red-100 text-red-800",
  terminated: "bg-gray-100 text-gray-800",
}

export default function Leases() {
  const [leases, setLeases] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLease, setSelectedLease] = useState(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchLeases()
  }, [])

  const fetchLeases = async () => {
    try {
      setLoading(true)
      const response = await leasesAPI.getAll()
      setLeases(response.data)
    } catch (error) {
      console.error("Error fetching leases:", error)
      toast.error("Failed to load leases")
    } finally {
      setLoading(false)
    }
  }

  const handleAddLease = () => {
    setSelectedLease(null)
    setIsModalOpen(true)
  }

  const handleEditLease = (lease) => {
    setSelectedLease(lease)
    setIsModalOpen(true)
  }

  const handleTerminateLease = async (leaseId) => {
    if (!window.confirm("Are you sure you want to terminate this lease?")) {
      return
    }

    try {
      await leasesAPI.terminate(leaseId)
      toast.success("Lease terminated successfully")
      fetchLeases()
    } catch (error) {
      console.error("Error terminating lease:", error)
      toast.error("Failed to terminate lease")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedLease(null)
  }

  const handleModalSuccess = () => {
    fetchLeases()
    handleModalClose()
  }

  const filteredLeases = leases.filter((lease) => {
    if (filter === "all") return true
    if (filter === "expiring") {
      const endDate = new Date(lease.end_date)
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      return endDate <= thirtyDaysFromNow && lease.status === "active"
    }
    return lease.status === filter
  })

  const getDaysUntilExpiry = (endDate) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="mt-1 text-sm text-gray-500">Manage property lease agreements</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={handleAddLease} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Lease
          </button>
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
          All Leases
        </button>
        <button
          onClick={() => setFilter("active")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "active" ? "bg-green-100 text-green-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter("expiring")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "expiring" ? "bg-orange-100 text-orange-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Expiring Soon
        </button>
        <button
          onClick={() => setFilter("expired")}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            filter === "expired" ? "bg-red-100 text-red-700" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Expired
        </button>
      </div>

      {/* Leases Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr className="table-row">
                <th className="table-head">Tenant</th>
                <th className="table-head">Unit</th>
                <th className="table-head">Start Date</th>
                <th className="table-head">End Date</th>
                <th className="table-head">Rent Amount</th>
                <th className="table-head">Status</th>
                <th className="table-head">Days to Expiry</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeases.map((lease) => {
                const daysToExpiry = getDaysUntilExpiry(lease.end_date)
                return (
                  <tr key={lease.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <div className="font-medium text-gray-900">{lease.tenant_name}</div>
                        <div className="text-sm text-gray-500">{lease.tenant_email}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="font-medium">{lease.unit_number}</span>
                      <div className="text-sm text-gray-500">{lease.unit_type?.replace("_", " ")}</div>
                    </td>
                    <td className="table-cell">{new Date(lease.start_date).toLocaleDateString()}</td>
                    <td className="table-cell">{new Date(lease.end_date).toLocaleDateString()}</td>
                    <td className="table-cell">
                      <span className="font-medium">{formatKSh(lease.rent_amount)}</span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[lease.status]}`}
                      >
                        {lease.status.charAt(0).toUpperCase() + lease.status.slice(1)}
                      </span>
                    </td>
                    <td className="table-cell">
                      {lease.status === "active" && (
                        <span
                          className={`font-medium ${
                            daysToExpiry <= 30
                              ? "text-red-600"
                              : daysToExpiry <= 60
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {daysToExpiry > 0 ? `${daysToExpiry} days` : "Expired"}
                          {daysToExpiry <= 30 && daysToExpiry > 0 && <AlertTriangle className="inline h-4 w-4 ml-1" />}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button onClick={() => handleEditLease(lease)} className="btn btn-ghost p-2">
                          <Edit className="h-4 w-4" />
                        </button>
                        {lease.status === "active" && (
                          <button
                            onClick={() => handleTerminateLease(lease.id)}
                            className="btn btn-ghost p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLeases.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leases found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === "all" ? "Get started by adding a new lease." : `No ${filter} leases found.`}
          </p>
          {filter === "all" && (
            <div className="mt-6">
              <button onClick={handleAddLease} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Lease
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <LeaseModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        lease={selectedLease}
      />
    </div>
  )
}
