"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Edit, Trash2, Mail, Phone, Users } from "lucide-react"
import { tenantsAPI } from "../services/api"
import TenantModal from "../components/TenantModal"
import toast from "react-hot-toast"

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [filteredTenants, setFilteredTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tenant.phone && tenant.phone.includes(searchTerm)),
      )
      setFilteredTenants(filtered)
    } else {
      setFilteredTenants(tenants)
    }
  }, [searchTerm, tenants])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await tenantsAPI.getAll()
      setTenants(response.data)
      setFilteredTenants(response.data)
    } catch (error) {
      console.error("Error fetching tenants:", error)
      toast.error("Failed to load tenants")
    } finally {
      setLoading(false)
    }
  }

  const handleAddTenant = () => {
    setSelectedTenant(null)
    setIsModalOpen(true)
  }

  const handleEditTenant = (tenant) => {
    setSelectedTenant(tenant)
    setIsModalOpen(true)
  }

  const handleDeleteTenant = async (tenantId) => {
    if (!window.confirm("Are you sure you want to delete this tenant?")) {
      return
    }

    try {
      await tenantsAPI.delete(tenantId)
      toast.success("Tenant deleted successfully")
      fetchTenants()
    } catch (error) {
      console.error("Error deleting tenant:", error)
      toast.error("Failed to delete tenant")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedTenant(null)
  }

  const handleModalSuccess = () => {
    fetchTenants()
    handleModalClose()
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
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your property tenants</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={handleAddTenant} className="btn btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search tenants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTenants.map((tenant) => (
          <div key={tenant.id} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{tenant.name}</h3>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-sm text-gray-500">
                    <Mail className="h-4 w-4 mr-2" />
                    {tenant.email}
                  </div>
                  {tenant.phone && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Phone className="h-4 w-4 mr-2" />
                      {tenant.phone}
                    </div>
                  )}
                </div>
                {tenant.unit_number && (
                  <div className="mt-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Unit {tenant.unit_number}
                    </span>
                  </div>
                )}
                <div className="mt-3 text-sm text-gray-500">
                  <p>Active Leases: {tenant.active_leases || 0}</p>
                  <p>Recent Payments: ${Number.parseFloat(tenant.recent_payments || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button onClick={() => handleEditTenant(tenant)} className="btn btn-ghost p-2">
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTenant(tenant.id)}
                  className="btn btn-ghost p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTenants.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Try adjusting your search terms." : "Get started by adding a new tenant."}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <button onClick={handleAddTenant} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Tenant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <TenantModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        tenant={selectedTenant}
      />
    </div>
  )
}
