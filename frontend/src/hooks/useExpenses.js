import { useState, useEffect, useCallback } from "react";
import { fetchExpenses, fetchCategories, createExpense } from "../utils/api";

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date_desc");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [exps, cats] = await Promise.all([
        fetchExpenses({ category: filter, sort }),
        fetchCategories(),
      ]);
      setExpenses(exps);
      setCategories(cats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter, sort]);

  useEffect(() => {
    load();
  }, [load]);

  const addExpense = useCallback(
    async (data, idempotencyKey) => {
      const created = await createExpense(data, idempotencyKey);
      // Reload so the list reflects actual DB state
      await load();
      return created;
    },
    [load]
  );

  const total = expenses
    .reduce((sum, e) => sum + parseFloat(e.amount), 0)
    .toFixed(2);

  return {
    expenses,
    categories,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    addExpense,
    refresh: load,
    total,
  };
}
