const BASE_URL = import.meta.env.VITE_API_URL || "";

export async function fetchExpenses({ category, sort } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (sort) params.set("sort", sort);
  const qs = params.toString() ? `?${params}` : "";
  const res = await fetch(`${BASE_URL}/expenses${qs}`);
  if (!res.ok) throw new Error(`Failed to fetch expenses (${res.status})`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${BASE_URL}/expenses/categories`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export async function createExpense(data, idempotencyKey) {
  const res = await fetch(`${BASE_URL}/expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify(data),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Failed to create expense");
  return body;
}
