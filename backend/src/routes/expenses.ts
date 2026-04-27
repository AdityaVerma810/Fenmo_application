import { Router } from "express";
import { z } from "zod";
import type { ExpenseStore } from "../storage.js";
import { HttpError } from "../http.js";
import { parseRupeesToPaise } from "../money.js";

const createExpenseBodySchema = z.object({
  amount: z.union([z.string(), z.number()]),
  category: z.string().trim().min(1).max(50),
  description: z.string().trim().min(1).max(200),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
});

const listQuerySchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["date_desc"]).optional()
});

export function expensesRouter(store: ExpenseStore): Router {
  const router = Router();

  router.post("/", async (req, res, next) => {
    try {
      const idempotencyKey = req.header("Idempotency-Key")?.trim();
      if (!idempotencyKey) {
        throw new HttpError(400, "Missing Idempotency-Key header");
      }

      const parsed = createExpenseBodySchema.safeParse(req.body);
      if (!parsed.success) throw new HttpError(400, "Invalid request body", parsed.error.flatten());

      const amountPaise = parseRupeesToPaise(parsed.data.amount);
      if (amountPaise <= 0) throw new HttpError(400, "amount must be greater than 0");

      const { expense, created } = await store.createOrGetByIdempotencyKey({
        idempotencyKey,
        amount_paise: amountPaise,
        category: parsed.data.category,
        description: parsed.data.description,
        date: parsed.data.date
      });

      res.status(created ? 201 : 200).json({ expense });
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const parsed = listQuerySchema.safeParse(req.query);
      if (!parsed.success) throw new HttpError(400, "Invalid query parameters", parsed.error.flatten());

      let expenses = await store.list();

      if (parsed.data.category) {
        expenses = expenses.filter((e) => e.category === parsed.data.category);
      }

      if (parsed.data.sort === "date_desc") {
        expenses = [...expenses].sort((a, b) => {
          if (a.date === b.date) return b.created_at.localeCompare(a.created_at);
          return b.date.localeCompare(a.date);
        });
      }

      res.json({ expenses });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

