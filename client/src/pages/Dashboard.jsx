"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Users, Building, DollarSign, AlertTriangle, TrendingUp, Calendar } from "lucide-react"
import { tenantsAPI, unitsAPI, paymentsAPI, leasesAPI } from "../services/api"
import { formatKSh, formatKShCompact } from "../utils/currency"
import toast from "react-hot-toast"

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    totalUnits: 0,
    occupiedUnits: 0,
    vacantUnits: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    expiringLeases: 0,
  })
  const [recentPayments, setRecentPayments] = useState([])
  const [expiringLeases, setExpiringLeases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [
        tenantsResponse,
        unitsResponse,
        occupancyResponse,
        paymentsResponse,
        arrearsResponse,
        expiringLeasesResponse,
      ] = await Promise.all([
        tenantsAPI.getAll(),
        unitsAPI.getAll(),
        unitsAPI.getOccupancyStats(),
        paymentsAPI.getAll(),
        paymentsAPI.getArrears(),
        leasesAPI.getExpiring(30),
      ])

      const tenants = tenantsResponse.data
      const units = unitsResponse.data
      const occupancyStats = occupancyResponse.data
      const payments = paymentsResponse.data
      const arrears = arrearsResponse.data
      const expiring = expiringLeasesResponse.data

      // Calculate stats
      const occupiedCount = occupancyStats.find((s) => s.status === "occupied")?.count || 0
      const vacantCount = occupancyStats.find((s) => s.status === "vacant")?.count || 0

      // Calculate monthly revenue (current month)
      const currentMonth = new Date().toISOString().slice(0, 7)
      const monthlyRevenue = payments
        .filter((p) => p.payment_date.startsWith(currentMonth) && p.payment_type === "rent")
        .reduce((sum, p) => sum + Number.parseFloat(p.amount), 0)

      setStats({
        totalTenants: tenants.length,
        totalUnits: units.length,
        occupiedUnits: occupiedCount,
        vacantUnits: vacantCount,
        monthlyRevenue,
        pendingPayments: arrears.length,
        expiringLeases: expiring.length,
      })

      // Set recent payments (last 5)
      setRecentPayments(payments.slice(0, 5))
      setExpiringLeases(expiring.slice(0, 5))
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <div className="card p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="text-2xl font-bold text-gray-900">{value}</dd>
          </dl>
        </div>
      </div>
      {link && (
        <div className="mt-4">
          <Link to={link} className="text-sm text-blue-600 hover:text-blue-500">
            View details →
          </Link>
        </div>
      )}
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
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome to your property management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Tenants" value={stats.totalTenants} icon={Users} color="text-blue-600" link="/tenants" />
        <StatCard
          title="Occupied Units"
          value={`${stats.occupiedUnits}/${stats.totalUnits}`}
          icon={Building}
          color="text-green-600"
          link="/units"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatKShCompact(stats.monthlyRevenue)}
          icon={DollarSign}
          color="text-green-600"
          link="/payments"
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={AlertTriangle}
          color="text-red-600"
          link="/reports"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard
          title="Vacant Units"
          value={stats.vacantUnits}
          icon={Building}
          color="text-yellow-600"
          link="/units"
        />
        <StatCard
          title="Expiring Leases"
          value={stats.expiringLeases}
          icon={Calendar}
          color="text-orange-600"
          link="/leases"
        />
        <StatCard
          title="Occupancy Rate"
          value={`${Math.round((stats.occupiedUnits / stats.totalUnits) * 100)}%`}
          icon={TrendingUp}
          color="text-purple-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
          </div>
          <div className="p-6">
            {recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.tenant_name}</p>
                      <p className="text-sm text-gray-500">
                        {payment.unit_number} • {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-green-600">{formatKSh(payment.amount)}</div>
                  </div>
                ))}
                <div className="pt-4">
                  <Link to="/payments" className="text-sm text-blue-600 hover:text-blue-500">
                    View all payments →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent payments</p>
            )}
          </div>
        </div>

        {/* Expiring Leases */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Expiring Leases (30 days)</h3>
          </div>
          <div className="p-6">
            {expiringLeases.length > 0 ? (
              <div className="space-y-4">
                {expiringLeases.map((lease) => (
                  <div key={lease.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lease.tenant_name}</p>
                      <p className="text-sm text-gray-500">
                        {lease.unit_number} • Expires {new Date(lease.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-orange-600">
                      {Math.ceil((new Date(lease.end_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Link to="/leases" className="text-sm text-blue-600 hover:text-blue-500">
                    View all leases →
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No expiring leases</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
