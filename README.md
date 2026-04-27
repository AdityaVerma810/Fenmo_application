# PaisaTrack — Expense Tracker

A minimal, production-grade full-stack personal expense tracker.

**Live demo:** _(deploy and update this link)_

---

## Features

- Add expenses with amount, category, description, and date
- View all expenses in a sorted, filterable table
- Filter by category; sort by date (newest / oldest first)
- Running total for the currently visible list
- Per-category spend breakdown (bar chart)
- Idempotency-safe API — retries and page refreshes never create duplicates
- Money stored as integer paise (no floating-point errors)

---

## Tech Stack

| Layer    | Choice                         |
|----------|--------------------------------|
| Backend  | Node.js + Express              |
| Database | SQLite via `better-sqlite3`    |
| Frontend | React 18 + Vite                |
| Styling  | Plain CSS (design tokens)      |
| Tests    | Jest + Supertest               |
| Deploy   | Docker Compose / Vite + Nginx  |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### 1 — Install dependencies

```bash
# From the root of the repo
cd backend && npm install
cd ../frontend && npm install
```

### 2 — Run in development

Open two terminals:

```bash
# Terminal 1 — API on http://localhost:3001
cd backend && npm run dev

# Terminal 2 — UI on http://localhost:5173 (proxied to backend)
cd frontend && npm run dev
```

Navigate to **http://localhost:5173**.

### 3 — Run tests

```bash
cd backend && npm test
```

### 4 — Docker (full stack)

```bash
docker-compose up --build
```

The UI will be available at **http://localhost:5173**.

---

## API Reference

### `POST /expenses`

Create a new expense.

**Headers**

| Header            | Required | Description                                        |
|-------------------|----------|----------------------------------------------------|
| `Idempotency-Key` | No       | Client-generated UUID. Same key → same response.  |

**Body**

```json
{
  "amount":      250.50,
  "category":    "Food",
  "description": "Lunch at office",
  "date":        "2024-03-15"
}
```

**Responses**

| Status | Meaning                                      |
|--------|----------------------------------------------|
| 201    | Created — new expense                        |
| 200    | OK — idempotent replay of an existing record |
| 400    | Validation error                             |

---

### `GET /expenses`

Return expenses, optionally filtered and sorted.

**Query parameters**

| Param      | Example       | Description                          |
|------------|---------------|--------------------------------------|
| `category` | `Food`        | Filter to a single category          |
| `sort`     | `date_desc`   | `date_desc` (default) or `date_asc`  |

**Response**

```json
[
  {
    "id":          "uuid-...",
    "amount":      "250.50",
    "category":    "Food",
    "description": "Lunch at office",
    "date":        "2024-03-15",
    "created_at":  "2024-03-15 10:22:00"
  }
]
```

---

### `GET /expenses/categories`

Return a sorted list of distinct categories.

```json
["Entertainment", "Food", "Transport", "Utilities"]
```

---

## Key Design Decisions

### Money as integer paise

All monetary values are stored as integers representing paise (1 INR = 100 paise). This avoids the classic floating-point problem where `0.1 + 0.2 !== 0.3`. The API accepts and returns decimal rupee strings (e.g., `"250.50"`) for human readability.

### Idempotency keys

The `POST /expenses` endpoint accepts an optional `Idempotency-Key` header. When provided:

1. Before inserting, the server checks the `idempotency_keys` table for the key.
2. If found, it returns the original expense (HTTP 200) — **no duplicate**.
3. If not found, it inserts the expense and the key in a single transaction.

The frontend generates a fresh UUID per form submission and stores it in a `useRef`. The key persists across React re-renders but a new one is generated after a successful save. This means clicking Submit multiple times or refreshing mid-flight all replay safely.

### SQLite as the database

SQLite with WAL mode is ideal for this scale:
- Zero-config, single binary, no separate process
- WAL journal allows concurrent reads during writes
- `better-sqlite3` exposes synchronous, transactional APIs — no async footguns
- Easily swapped for PostgreSQL by replacing `src/db/database.js`

### Validation with Zod

Request bodies are validated with Zod schemas on the server. The frontend does a lightweight duplicate validation pass before sending to give instant feedback, but all correctness guarantees live server-side.

---

## Trade-offs (given the timebox)

| Decision | Trade-off |
|----------|-----------|
| SQLite over Postgres | No replication, not suitable for multi-instance deploy. Fine for personal use; swap the `getDb` module for multi-user scale. |
| In-memory idempotency key expiry omitted | Old keys accumulate in SQLite. A cron to `DELETE FROM idempotency_keys WHERE created_at < datetime('now', '-7 days')` would fix this in production. |
| No authentication | No user accounts — all data is shared. Adding JWT middleware on the Express routes is the natural next step. |
| Optimistic UI skipped | The list always reloads from the server after a successful POST. This is correct and simple; an optimistic insert would feel faster but adds rollback complexity. |
| CSS without a component library | Faster to ship; avoids unnecessary bundle weight for a small UI. |

---

## Intentionally Omitted

- Authentication / multi-user support
- Pagination (acceptable for personal use at small scale)
- Edit / delete expense
- CSV export
- End-to-end tests (Playwright/Cypress)
- CI/CD pipeline

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── src/
│   │   ├── db/database.js          # SQLite setup + migrations
│   │   ├── routes/expenses.js      # POST + GET handlers
│   │   ├── middleware/errorHandler.js
│   │   └── index.js                # Express app
│   ├── tests/expenses.test.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddExpenseForm.jsx
│   │   │   ├── ExpenseList.jsx
│   │   │   └── CategorySummary.jsx
│   │   ├── hooks/useExpenses.js
│   │   ├── utils/api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```
