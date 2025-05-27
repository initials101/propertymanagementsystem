import { Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import Dashboard from "./pages/Dashboard"
import Tenants from "./pages/Tenants"
import Units from "./pages/Units"
import Leases from "./pages/Leases"
import Payments from "./pages/Payments"
import Reports from "./pages/Reports"
import Invoices from "./pages/Invoices"

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tenants" element={<Tenants />} />
        <Route path="/units" element={<Units />} />
        <Route path="/leases" element={<Leases />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/invoices" element={<Invoices />} />
      </Routes>
    </Layout>
  )
}

export default App
