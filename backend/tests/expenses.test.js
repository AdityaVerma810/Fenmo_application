const request = require("supertest");
const app = require("../src/index");
const { resetDb } = require("../src/db/database");

// Force in-memory DB for tests
process.env.NODE_ENV = "test";

beforeEach(() => {
  resetDb();
});

afterAll(() => {
  resetDb();
});

describe("POST /expenses", () => {
  const validExpense = {
    amount: 250.5,
    category: "Food",
    description: "Lunch at office",
    date: "2024-03-15",
  };

  test("creates a new expense and returns 201", async () => {
    const res = await request(app).post("/expenses").send(validExpense);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      amount: "250.50",
      category: "Food",
      description: "Lunch at office",
      date: "2024-03-15",
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  test("returns 400 for missing required fields", async () => {
    const res = await request(app)
      .post("/expenses")
      .send({ amount: 100 }); // missing category, description, date
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Validation failed");
  });

  test("returns 400 for negative amount", async () => {
    const res = await request(app)
      .post("/expenses")
      .send({ ...validExpense, amount: -50 });
    expect(res.status).toBe(400);
  });

  test("returns 400 for bad date format", async () => {
    const res = await request(app)
      .post("/expenses")
      .send({ ...validExpense, date: "15-03-2024" });
    expect(res.status).toBe(400);
  });

  test("idempotency: same key returns original expense without duplicate", async () => {
    const key = "test-idem-key-001";

    const first = await request(app)
      .post("/expenses")
      .set("Idempotency-Key", key)
      .send(validExpense);

    const second = await request(app)
      .post("/expenses")
      .set("Idempotency-Key", key)
      .send(validExpense);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id); // same record
  });

  test("different idempotency keys create different expenses", async () => {
    const first = await request(app)
      .post("/expenses")
      .set("Idempotency-Key", "key-a")
      .send(validExpense);

    const second = await request(app)
      .post("/expenses")
      .set("Idempotency-Key", "key-b")
      .send(validExpense);

    expect(first.body.id).not.toBe(second.body.id);
  });
});

describe("GET /expenses", () => {
  beforeEach(async () => {
    await request(app)
      .post("/expenses")
      .send({ amount: 500, category: "Food", description: "Dinner", date: "2024-03-10" });
    await request(app)
      .post("/expenses")
      .send({ amount: 1200, category: "Transport", description: "Cab", date: "2024-03-12" });
    await request(app)
      .post("/expenses")
      .send({ amount: 300, category: "Food", description: "Snacks", date: "2024-03-15" });
  });

  test("returns all expenses", async () => {
    const res = await request(app).get("/expenses");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });

  test("filters by category", async () => {
    const res = await request(app).get("/expenses?category=Food");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body.every((e) => e.category === "Food")).toBe(true);
  });

  test("sorts by date descending by default", async () => {
    const res = await request(app).get("/expenses?sort=date_desc");
    const dates = res.body.map((e) => e.date);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
  });

  test("amounts are formatted as decimal strings", async () => {
    const res = await request(app).get("/expenses");
    res.body.forEach((e) => {
      expect(e.amount).toMatch(/^\d+\.\d{2}$/);
    });
  });
});

describe("GET /expenses/categories", () => {
  test("returns distinct categories sorted", async () => {
    await request(app)
      .post("/expenses")
      .send({ amount: 100, category: "Utilities", description: "Electric bill", date: "2024-03-01" });
    await request(app)
      .post("/expenses")
      .send({ amount: 200, category: "Food", description: "Groceries", date: "2024-03-02" });

    const res = await request(app).get("/expenses/categories");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(["Food", "Utilities"]);
  });
});
