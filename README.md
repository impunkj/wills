# Wills24 Admin Dashboard

A full-stack legal case and will management SaaS application built for Indian legal firms.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + TypeScript |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS v4 |
| Auth | JWT + Passport |
| Testing | Vitest |

---

## Prerequisites

- Node.js v18 or higher
- PostgreSQL 14 or higher
- npm v9 or higher
- Git

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/wills24.git
cd wills24/product-plan
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/wills24"
VITE_API_URL="http://localhost:3000"
JWT_SECRET="your-secret-key-change-in-production"
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### 4. Create the database

```bash
psql -U postgres -c "CREATE DATABASE wills24;"
```

Or open pgAdmin and create a database named `wills24`.

### 5. Push the database schema

```bash
npx prisma db push
npx prisma generate
```

### 6. Seed the database

```bash
npm run seed
```

Default accounts created:

| Email | Password | Role |
|-------|----------|------|
| admin@wills24.com | admin123 | Admin |
| wm@wills24.com | wm123 | Wealth Manager |
| lawyer@wills24.com | lawyer123 | Lawyer |
| support@wills24.com | support123 | Support |

### 7. Start the backend

```bash
npm run start:dev
```

Wait for:
```
Wills24 API running on http://localhost:3000/api
```

### 8. Start the frontend (new terminal)

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Project Structure

```
product-plan/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # SQL migration files
│   └── prisma.config.ts       # Prisma 7 config
├── src/
│   ├── modules/               # NestJS backend modules
│   │   ├── auth/              # JWT authentication
│   │   ├── dashboard/         # Dashboard API
│   │   ├── sales-crm/         # Leads and quotations
│   │   ├── accounts/          # Account management
│   │   ├── customers/         # Customer management
│   │   ├── cases/             # Case management
│   │   ├── partners/          # Partner management
│   │   ├── team/              # Team management
│   │   ├── lawyers/           # Lawyers directory
│   │   └── reports/           # Reports and analytics
│   ├── features/              # React feature components
│   ├── pages/                 # React page wrappers
│   ├── services/              # Frontend API service layer
│   ├── shell/                 # App shell components
│   ├── lib/                   # Shared utilities
│   ├── types/                 # TypeScript type definitions
│   ├── App.tsx                # Main React app
│   ├── main.tsx               # React entry point
│   ├── main.ts                # NestJS entry point
│   └── app.module.ts          # NestJS root module
├── .env                       # Environment variables (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
├── tsconfig.server.json       # TypeScript config for NestJS
├── vite.config.ts             # Vite config
└── nest-cli.json              # NestJS CLI config
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend dev server on port 5173 |
| `npm run start:dev` | Start NestJS backend on port 3000 |
| `npm run build` | Build frontend for production |
| `npm run test` | Run all tests |
| `npm run seed` | Seed database with default users and data |

---

## API Endpoints

All endpoints require `Authorization: Bearer TOKEN` header
except `POST /api/auth/login`.

| Module | Endpoint | Methods |
|--------|----------|---------|
| Auth | /api/auth/login | POST |
| Dashboard | /api/dashboard/summary | GET |
| Dashboard | /api/dashboard/activity-feed | GET |
| Dashboard | /api/dashboard/pending-items | GET |
| Dashboard | /api/dashboard/sales-trend | GET |
| Leads | /api/sales-crm/leads | GET, POST |
| Leads | /api/sales-crm/leads/:id | GET, PATCH, DELETE |
| Quotations | /api/sales-crm/leads/:id/quotations | POST |
| Accounts | /api/accounts | GET, POST |
| Accounts | /api/accounts/:id | GET, PATCH |
| Customers | /api/customers | GET, POST |
| Customers | /api/customers/:id | GET, PATCH |
| Cases | /api/cases | GET, POST |
| Cases | /api/cases/:id | GET, PATCH |
| Cases | /api/cases/:id/follow-ups | GET, POST |
| Partners | /api/partners | GET, POST |
| Partners | /api/partners/:id | GET, PATCH |
| Team | /api/team | GET, POST |
| Team | /api/team/wealth-managers | GET |
| Lawyers | /api/lawyers | GET, POST |
| Reports | /api/reports/sales | GET |
| Reports | /api/reports/export/excel | GET |

---

## Features

- ✅ JWT authentication with role-based access control
- ✅ Dashboard with live KPIs and charts
- ✅ Sales CRM — lead pipeline and quotation management
- ✅ Account management with invoicing
- ✅ Customer management with detail tabs
- ✅ Legal case management with follow-ups
- ✅ Partner management with wallet system
- ✅ Team management with KYC tracking
- ✅ Lawyers directory with specialization filters
- ✅ Reports with Excel and PDF export
- ✅ Light and dark mode support
- ✅ Fully responsive design

---

## Roles and Permissions

| Role | Access |
|------|--------|
| ADMIN | Full access to all modules |
| WEALTH_MANAGER | Dashboard, Sales CRM, Accounts, Customers, Cases, Partners |
| LAWYER | Dashboard, Cases |
| SUPPORT | Dashboard, Customers |

---

## Database Models

| Model | Description |
|-------|-------------|
| User | Authentication and role management |
| Lead | Sales pipeline leads |
| Customer | Client records |
| Case | Legal case management |
| Account | Business accounts |
| Invoice | Invoice tracking |
| Payment | Payment records |
| Partner | Partner firms |
| PartnerPackage | Partner will packages |
| Lawyer | Lawyers directory |
| TeamMember | Staff management |
| FollowUp | Case follow-up actions |
| Quotation | Service quotations |

---

## Common Issues

**Database connection error**
Make sure PostgreSQL is running and `DATABASE_URL` in `.env` has the correct password.

**Port 3000 already in use**
```bash
# Find and kill the process
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**Prisma schema errors after pulling**
```bash
npx prisma db push
npx prisma generate
```

**Login not working after fresh setup**
Make sure you ran `npm run seed` to create default users.

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://postgres:pass@localhost:5432/wills24 |
| VITE_API_URL | Backend API URL for frontend | http://localhost:3000 |
| JWT_SECRET | Secret key for JWT tokens | your-secret-key |
| PORT | Backend server port (optional) | 3000 |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is proprietary software owned by Wills24.

---
```

