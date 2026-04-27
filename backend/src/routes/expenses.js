const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { getDb } = require("../db/database");

const router = express.Router();

// ── Validation schema ──────────────────────────────────────────────────────
const CreateExpenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: "amount must be a number" })
    .positive("amount must be positive")
    .max(10_000_000, "amount too large"),
  category: z.string().min(1, "category is required").max(100),
  description: z.string().min(1, "description is required").max(500),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD format"),
});

// Helper: convert paise (integer) → rupees (decimal string, 2dp)
function paiseToRupees(paise) {
  return (paise / 100).toFixed(2);
}

// Helper: convert rupee amount (float) → paise integer
function rupeesToPaise(amount) {
  return Math.round(amount * 100);
}

function formatExpense(row) {
  return {
    id: row.id,
    amount: paiseToRupees(row.amount),
    category: row.category,
    description: row.description,
    date: row.date,
    created_at: row.created_at,
  };
}

// ── POST /expenses ─────────────────────────────────────────────────────────
// Idempotency: client sends Idempotency-Key header; replaying the same key
// returns the original response without creating a duplicate.
router.post("/", (req, res) => {
  const idempotencyKey = req.headers["idempotency-key"];

  // Validate body
  const parse = CreateExpenseSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: parse.error.flatten().fieldErrors,
    });
  }

  const { amount, category, description, date } = parse.data;
  const db = getDb();

  // If idempotency key provided, check for existing record
  if (idempotencyKey) {
    const existing = db
      .prepare(
        `SELECT e.* FROM expenses e
         JOIN idempotency_keys ik ON ik.expense_id = e.id
         WHERE ik.key = ?`
      )
      .get(idempotencyKey);

    if (existing) {
      return res.status(200).json(formatExpense(existing));
    }
  }

  const id = uuidv4();
  const amountPaise = rupeesToPaise(amount);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (id, amount, category, description, date)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertKey = db.prepare(`
    INSERT INTO idempotency_keys (key, expense_id) VALUES (?, ?)
  `);

  // Use a transaction so both inserts succeed or neither does
  const run = db.transaction(() => {
    insertExpense.run(id, amountPaise, category.trim(), description.trim(), date);
    if (idempotencyKey) {
      insertKey.run(idempotencyKey, id);
    }
  });

  run();

  const created = db.prepare("SELECT * FROM expenses WHERE id = ?").get(id);
  return res.status(201).json(formatExpense(created));
});

// ── GET /expenses ──────────────────────────────────────────────────────────
router.get("/", (req, res) => {
  const { category, sort } = req.query;
  const db = getDb();

  let query = "SELECT * FROM expenses";
  const params = [];

  if (category && category !== "all") {
    query += " WHERE category = ?";
    params.push(category);
  }

  query += sort === "date_asc" ? " ORDER BY date ASC" : " ORDER BY date DESC";

  const rows = db.prepare(query).all(...params);
  return res.json(rows.map(formatExpense));
});

// ── GET /expenses/categories ───────────────────────────────────────────────
router.get("/categories", (req, res) => {
  const db = getDb();
  const rows = db
    .prepare("SELECT DISTINCT category FROM expenses ORDER BY category ASC")
    .all();
  return res.json(rows.map((r) => r.category));
});

module.exports = router;
