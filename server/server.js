import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { testConnection } from "./config/database.js"

// Import routes
import tenantsRouter from "./routes/tenants.routes.js"
import unitsRouter from "./routes/unit.routes.js"
import leasesRouter from "./routes/lease.routes.js"
import paymentsRouter from "./routes/payments.routes.js"
import reportsRouter from "./routes/reports.routes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/tenants", tenantsRouter)
app.use("/api/units", unitsRouter)
app.use("/api/leases", leasesRouter)
app.use("/api/payments", paymentsRouter)
app.use("/api/reports", reportsRouter)

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Property Management API is running" })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: "Something went wrong!" })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`)
  await testConnection()
})

export default app
