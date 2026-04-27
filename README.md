# Fenmo Expense Tracker (Full Stack)

This is a minimal **full-stack Expense Tracker** (backend API + frontend UI) built for the assignment.

## What you can do
- Add a new expense: amount, category, description, date
- View expenses in a table
- Filter by category
- Sort by date (newest first)
- See total of the currently visible list

## Tech stack (why these?)
- **Backend**: Node.js + Express
- **Database**: **SQLite** (simple, reliable, zero setup for evaluators)
  - Money is stored as **integer paise** (₹1.23 => 123) to avoid floating point bugs.
- **Frontend**: React + Vite

## Repo structure
- `backend/` - API server + SQLite DB
- `frontend/` - React UI

## Quick start (local)
### 1) Install dependencies
```bash
npm install
```

### 2) Run backend + frontend
```bash
npm run dev
```

Backend will run on `http://localhost:4000` and frontend on `http://localhost:5173` (default Vite port).

## Notes (will be expanded)
- The API is designed to handle retries safely using an **idempotency key** on create requests.
- The UI handles slow/failed requests and avoids double-submits.

