const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH =
  process.env.NODE_ENV === "test"
    ? ":memory:"
    : path.join(__dirname, "../../data/expenses.db");

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
  }
  return db;
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          TEXT PRIMARY KEY,
      amount      INTEGER NOT NULL,        -- stored in paise (1/100 rupee) to avoid float errors
      category    TEXT NOT NULL,
      description TEXT NOT NULL,
      date        TEXT NOT NULL,           -- ISO date string YYYY-MM-DD
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key         TEXT PRIMARY KEY,
      expense_id  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (expense_id) REFERENCES expenses(id)
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(date DESC);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);
}

function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, resetDb };
