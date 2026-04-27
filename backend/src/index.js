const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const expensesRouter = require("./routes/expenses");
const { errorHandler } = require("./middleware/errorHandler");

// Ensure data directory exists for SQLite file
const dataDir = path.join(__dirname, "../data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/expenses", expensesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Expense Tracker API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
