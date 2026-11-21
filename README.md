# Expense Management System

A full-stack expense management application with JWT authentication, role-based access, expense CRUD with soft delete, an approval workflow, audit history, filtering/sorting/pagination, dashboard analytics, and CSV/Excel export.

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Axios, Recharts
- **Backend:** Node.js, Express.js, Sequelize (JavaScript ES6 modules only)
- **Database:** MySQL 8+ (schema defined in `backend/database/schema.sql`)
- **Security:** bcrypt, JWT, Helmet, CORS allowlist, rate limiting, Joi validation, centralized error handling
- **Hosting:** Vercel (frontend), Railway (backend + MySQL)

## Features

### Authentication & Authorization
- Login with bcrypt password hashing and JWT
- `ADMIN` and `USER` roles enforced on the backend
- Users see only their own expenses; admins see all
- Protected frontend routes and 401 session cleanup

### Expense Management
- Create, view, update, soft-delete expenses
- Mandatory static category dropdown for create/edit and category filtering
- Search (title/description), status/category/date filters, sorting, server-side pagination
- Approval/rejection with reason and audit trail
- Transactions, row locks, and optimistic `version` checks

### Dashboard & Reports
- Monthly/yearly totals, highest expense, category summary, 12-month trend, status breakdown
- Export filtered expenses to CSV or Excel-compatible `.xls`

## Static Categories

The same ten values are used by the frontend dropdown, backend validation, and MySQL ENUM column:

`Food`, `Travel`, `Accommodation`, `Transportation`, `Shopping`, `Medical`, `Entertainment`, `Utilities`, `Office Supplies`, `Other`.

The form placeholder is **Select Category** and the field is required. Fresh databases get the ENUM directly from `schema.sql`; existing databases can be normalized with the manual SQL in [`DEPLOYMENT.md`](docs/DEPLOYMENT.md), which preserves all records. There is no category management module.

## Repository Structure

```
backend/
  database/          schema.sql
  src/               app.js, config, constants, controllers, middleware,
                     models, routes, utils, validators
  .env.example, package.json, railway.json, server.js
frontend/
  src/               components, constants, context, pages, services, App.jsx
  .env.example, index.html, package.json, vercel.json, vite.config.js
docs/
  API.md, DEPLOYMENT.md
.env.example, .gitignore, README.md
```

## Prerequisites

- Node.js 18+ and npm
- MySQL 8+
- A Railway account (backend/database) and a Vercel account (frontend)

## Local Setup

### 1. Database

Create the schema directly from SQL:

```bash
mysql -h localhost -u root -p < backend/database/schema.sql
```

This creates the `expense_management` database and its tables. To create an admin account manually, generate a hash and insert the row:

```bash
cd backend
node -e "import('bcrypt').then(async ({default:b}) => console.log(await b.hash('Admin@12345',12)))"
```

```sql
USE expense_management;
INSERT INTO users (name, email, password, role, is_active, created_at, updated_at)
VALUES ('System Admin', 'admin@example.com', '<PASTE_HASH_HERE>', 'ADMIN', 1, NOW(), NOW());
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

`.env` must include `DB_NAME`, `DB_USER`, `JWT_SECRET`, and the remaining values from `backend/.env.example`. The API runs at `http://localhost:5000/api/v1`; health check: `GET /health`.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

`frontend/.env` needs `VITE_API_URL=http://localhost:5000/api/v1`. Open `http://localhost:5173`.

## Scripts

| Location | Script | Purpose |
|---|---|---|
| backend | `npm start` | Production server |
| backend | `npm run dev` | Development server with nodemon |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run build` | Production build into `dist/` |
| frontend | `npm run preview` | Preview the production build |

## Documentation

- [REST API reference](docs/API.md)
- [Vercel + Railway deployment guide](docs/DEPLOYMENT.md)
- Root [`.env.example`](.env.example) lists every production variable

## Deployment

- Backend: Railway service rooted at `backend/`, using `backend/railway.json`
- Frontend: Vercel project rooted at `frontend/`, using `frontend/vercel.json`
- Set `CLIENT_URL` on Railway to the Vercel origin and `VITE_API_URL` on Vercel to the Railway API URL

Deployed application: **<ADD_DEPLOYED_LINK_HERE>** (update after deployment).

## Submission Checklist

- [x] Complete source code
- [x] README and setup instructions
- [x] `.env.example` files (root, backend, frontend)
- [x] Database schema and manual setup SQL
- [x] API documentation
- [x] Production configuration for Vercel and Railway
- [ ] Deployed application link
