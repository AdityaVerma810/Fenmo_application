import request from "supertest";
import path from "node:path";
import fs from "node:fs/promises";
import { createApp } from "../src/app.js";
import { ExpenseStore } from "../src/storage.js";

async function createTestStore() {
  const dir = path.join(process.cwd(), ".test-data");
  await fs.rm(dir, { recursive: true, force: true });
  const store = new ExpenseStore({ dataDir: dir });
  await store.init();
  return { store, dir };
}

describe("expenses API", () => {
  it("creates expense and is idempotent with same Idempotency-Key", async () => {
    const { store, dir } = await createTestStore();
    const app = createApp({ store, corsOrigin: "*" });

    const body = { amount: "10.50", category: "Food", description: "Lunch", date: "2026-04-27" };
    const key = "req-123";

    const first = await request(app).post("/expenses").set("Idempotency-Key", key).send(body);
    expect(first.status).toBe(201);
    const id1 = first.body.expense.id;

    const second = await request(app).post("/expenses").set("Idempotency-Key", key).send(body);
    expect(second.status).toBe(200);
    const id2 = second.body.expense.id;

    expect(id2).toBe(id1);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it("lists expenses, supports category filter and date_desc sort", async () => {
    const { store, dir } = await createTestStore();
    const app = createApp({ store, corsOrigin: "*" });

    await request(app)
      .post("/expenses")
      .set("Idempotency-Key", "a")
      .send({ amount: 1, category: "Food", description: "A", date: "2026-04-01" });
    await request(app)
      .post("/expenses")
      .set("Idempotency-Key", "b")
      .send({ amount: 1, category: "Travel", description: "B", date: "2026-04-10" });
    await request(app)
      .post("/expenses")
      .set("Idempotency-Key", "c")
      .send({ amount: 1, category: "Food", description: "C", date: "2026-04-05" });

    const filtered = await request(app).get("/expenses").query({ category: "Food", sort: "date_desc" });
    expect(filtered.status).toBe(200);
    expect(filtered.body.expenses).toHaveLength(2);
    expect(filtered.body.expenses[0].date).toBe("2026-04-05");
    expect(filtered.body.expenses[1].date).toBe("2026-04-01");

    await fs.rm(dir, { recursive: true, force: true });
  });
});

