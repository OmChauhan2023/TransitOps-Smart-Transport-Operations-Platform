# TransitOps — Smart Transport Operations Platform

TransitOps is a comprehensive, enterprise-grade Role-Based Transport Operations & Fleet Management system built with **Node.js + Express + TypeScript + Prisma ORM + PostgreSQL** on the backend and **React (Vite + TypeScript) + Tailwind CSS + Recharts** on the frontend.

---

## 1. Project Structure

```
TransitOps-Smart-Transport-Operations-Platform/
├── backend/                  # Node.js + Express + TypeScript API Server
│   ├── prisma/
│   │   └── schema.prisma     # Prisma ORM Database Schema (PostgreSQL)
│   ├── src/                  # Controllers, Routes, Middlewares, Services
│   ├── .env.example          # Environment variables template
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # React + Vite + TypeScript + Tailwind CSS UI
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
└── package.json              # Root package with workspace runner scripts
```

---

## 2. Roles & Access Control (RBAC)

| Role | Fleet | Drivers | Trips | Fuel/Exp | Analytics |
|---|---|---|---|---|---|
| **Fleet Manager** | Full | Full | None | None | Full |
| **Dispatcher** | Read-Only | None | Full | None | None |
| **Safety Officer** | None | Full | Read-Only | None | None |
| **Financial Analyst** | Read-Only | None | None | Full | Full |

---

## 3. Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL server

### Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```