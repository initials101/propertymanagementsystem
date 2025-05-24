import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)

// Tenants API
export const tenantsAPI = {
  getAll: (search = "") => api.get(`/tenants${search ? `?search=${search}` : ""}`),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post("/tenants", data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  delete: (id) => api.delete(`/tenants/${id}`),
}

// Units API
export const unitsAPI = {
  getAll: () => api.get("/units"),
  getById: (id) => api.get(`/units/${id}`),
  getVacant: () => api.get("/units/vacant"),
  getOccupancyStats: () => api.get("/units/occupancy-stats"),
  create: (data) => api.post("/units", data),
  update: (id, data) => api.put(`/units/${id}`, data),
  updateStatus: (id, status) => api.patch(`/units/${id}/status`, { status }),
  delete: (id) => api.delete(`/units/${id}`),
}

// Leases API
export const leasesAPI = {
  getAll: () => api.get("/leases"),
  getById: (id) => api.get(`/leases/${id}`),
  getActive: () => api.get("/leases/active"),
  getExpiring: (days = 30) => api.get(`/leases/expiring?days=${days}`),
  create: (data) => api.post("/leases", data),
  update: (id, data) => api.put(`/leases/${id}`, data),
  terminate: (id) => api.patch(`/leases/${id}/terminate`),
}

// Payments API
export const paymentsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/payments${query ? `?${query}` : ""}`)
  },
  getById: (id) => api.get(`/payments/${id}`),
  getStats: () => api.get("/payments/stats"),
  getArrears: () => api.get("/payments/arrears"),
  create: (data) => api.post("/payments", data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  delete: (id) => api.delete(`/payments/${id}`),
}

// Reports API
export const reportsAPI = {
  downloadArrearsReport: (format) => {
    return api.get(`/reports/arrears/${format}`, { responseType: "blob" })
  },
  downloadPaymentHistory: (format, params = {}) => {
    const query = new URLSearchParams(params).toString()
    return api.get(`/reports/payments/${format}${query ? `?${query}` : ""}`, { responseType: "blob" })
  },
  downloadOccupancyReport: (format) => {
    return api.get(`/reports/occupancy/${format}`, { responseType: "blob" })
  },
}

export default api
