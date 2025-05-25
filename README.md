# Property Management System

A full-stack property management system built with React (Vite) frontend and Node.js/Express backend with MySQL database.

## Features

### Frontend (React + Vite)
- **Dashboard**: Overview of key metrics, recent payments, and expiring leases
- **Tenants Management**: Add, edit, delete, and search tenants
- **Units Management**: Manage property units with status tracking
- **Leases Management**: Create and manage lease agreements
- **Payments Tracking**: Record and track tenant payments
- **Reports Generation**: Generate PDF and Excel reports for arrears, payment history, and occupancy

### Backend (Node.js + Express)
- **RESTful API**: Complete CRUD operations for all entities
- **Database Integration**: MySQL with proper relationships and constraints
- **Report Generation**: PDF and Excel export functionality
- **Data Validation**: Input validation and error handling

## Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Axios
- Tailwind CSS
- Lucide React (icons)
- React Hot Toast

### Backend
- Node.js
- Express.js
- MySQL2
- PDFKit (PDF generation)
- ExcelJS (Excel generation)
- CORS
- Dotenv

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```cd server
```
2. Install dependencies:
```npm install
```
3. Create a MySQL database:
\`\`\`sql
CREATE DATABASE property_management;
```
4. Copy the environment file and configure:
```cp .env.example .env
```
5. Update the `.env` file with your database credentials:
\`\`\`env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=property_management
PORT=5000
```
6. Initialize the database:
```npm run initDatabase
```
7. Start the server:
```
npm run dev
```
The backend will be running on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```cd client
```
2. Install dependencies:
```npm install
```
3. Create environment file:
```cp .env.example .env
```
4. Update the `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```
5. Start the development server:
```
npm run dev
```
The frontend will be running on `http://localhost:5173`

## Database Schema

### Tables
- **tenants**: Tenant information and contact details
- **units**: Property units with type, rent, and status
- **leases**: Lease agreements linking tenants to units
- **payments**: Payment records with type and status tracking

### Relationships
- One-to-many: Tenants → Leases
- One-to-many: Units → Leases
- One-to-many: Tenants → Payments
- Many-to-one: Payments → Leases (optional)

## API Endpoints

### Tenants
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/:id` - Get tenant by ID
- `POST /api/tenants` - Create new tenant
- `PUT /api/tenants/:id` - Update tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Units
- `GET /api/units` - Get all units
- `GET /api/units/vacant` - Get vacant units
- `GET /api/units/occupancy-stats` - Get occupancy statistics
- `POST /api/units` - Create new unit
- `PUT /api/units/:id` - Update unit
- `PATCH /api/units/:id/status` - Update unit status
- `DELETE /api/units/:id` - Delete unit

### Leases
- `GET /api/leases` - Get all leases
- `GET /api/leases/active` - Get active leases
- `GET /api/leases/expiring` - Get expiring leases
- `POST /api/leases` - Create new lease
- `PUT /api/leases/:id` - Update lease
- `PATCH /api/leases/:id/terminate` - Terminate lease

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/stats` - Get payment statistics
- `GET /api/payments/arrears` - Get arrears report
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id` - Update payment
- `DELETE /api/payments/:id` - Delete payment

### Reports
- `GET /api/reports/arrears/pdf` - Download arrears report (PDF)
- `GET /api/reports/arrears/excel` - Download arrears report (Excel)
- `GET /api/reports/payments/pdf` - Download payment history (PDF)
- `GET /api/reports/payments/excel` - Download payment history (Excel)
- `GET /api/reports/occupancy/pdf` - Download occupancy report (PDF)
- `GET /api/reports/occupancy/excel` - Download occupancy report (Excel)

## Features

### Dashboard
- Total tenants, units, and occupancy statistics
- Monthly revenue tracking
- Recent payments display
- Expiring leases alerts

### Tenant Management
- Complete tenant profiles with contact information
- Emergency contact details
- Search and filter functionality
- Active lease tracking

### Unit Management
- Unit status tracking (vacant, occupied, maintenance)
- Rent amount management
- Unit type categorization
- Occupancy statistics

### Lease Management
- Lease creation with tenant and unit assignment
- Lease term tracking
- Expiration alerts
- Lease termination functionality

### Payment Tracking
- Multiple payment types (rent, deposit, late fees, etc.)
- Payment method tracking
- Status management (completed, pending, failed)
- Payment history and search

### Reporting
- Arrears report with outstanding amounts
- Payment history with date range filtering
- Occupancy reports with tenant details
- Export to PDF and Excel formats

## Development

### Running in Development Mode

Backend:
```
cd server
npm run dev
```
Frontend:
```cd client
npm run dev
```
### Building for Production

Frontend:
```cd client
npm run build
```
Backend:
```
cd server
npm start
```
