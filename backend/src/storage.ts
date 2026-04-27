import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Expense, ExpensesFile } from "./types.js";

const expensesFileSchema = z.object({
  expenses: z
    .array(
      z.object({
        id: z.string(),
        amount_paise: z.number().int(),
        category: z.string(),
        description: z.string(),
        date: z.string(),
        created_at: z.string(),
        idempotency_key: z.string()
      })
    )
    .default([])
});

function createDefaultFile(): ExpensesFile {
  return { expenses: [] };
}

export class ExpenseStore {
  private filePath: string;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(params: { dataDir: string }) {
    this.filePath = path.join(params.dataDir, "expenses.json");
  }

  async init(): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      expensesFileSchema.parse(JSON.parse(raw));
    } catch (err) {
      const initial = createDefaultFile();
      await this.atomicWrite(initial);
    }
  }

  async list(): Promise<Expense[]> {
    const file = await this.readFile();
    return file.expenses;
  }

  async createOrGetByIdempotencyKey(input: {
    idempotencyKey: string;
    amount_paise: number;
    category: string;
    description: string;
    date: string;
  }): Promise<{ expense: Expense; created: boolean }> {
    return this.withWriteLock(async () => {
      const file = await this.readFile();
      const existing = file.expenses.find((e) => e.idempotency_key === input.idempotencyKey);
      if (existing) return { expense: existing, created: false };

      const now = new Date().toISOString();
      const expense: Expense = {
        id: randomUUID(),
        amount_paise: input.amount_paise,
        category: input.category,
        description: input.description,
        date: input.date,
        created_at: now,
        idempotency_key: input.idempotencyKey
      };

      file.expenses.push(expense);
      await this.atomicWrite(file);
      return { expense, created: true };
    });
  }

  private async readFile(): Promise<ExpensesFile> {
    const raw = await fs.readFile(this.filePath, "utf8");
    return expensesFileSchema.parse(JSON.parse(raw));
  }

  private async atomicWrite(file: ExpensesFile): Promise<void> {
    const dir = path.dirname(this.filePath);
    const tempPath = path.join(dir, `expenses.${randomUUID()}.tmp`);
    const data = JSON.stringify(file, null, 2) + "\n";
    await fs.writeFile(tempPath, data, "utf8");
    await fs.rename(tempPath, this.filePath);
  }

  private async withWriteLock<T>(fn: () => Promise<T>): Promise<T> {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previous = this.writeChain;
    this.writeChain = previous.then(() => gate);

    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

