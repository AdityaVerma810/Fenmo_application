import express from "express";
import cors from "cors";
import type { ExpenseStore } from "./storage.js";
import { errorHandler, notFoundHandler } from "./http.js";
import { expensesRouter } from "./routes/expenses.js";

export function createApp(params: { store: ExpenseStore; corsOrigin: string }) {
  const app = express();

  app.use(
    cors({
      origin: params.corsOrigin
    })
  );
  app.use(express.json({ limit: "32kb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/expenses", expensesRouter(params.store));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

