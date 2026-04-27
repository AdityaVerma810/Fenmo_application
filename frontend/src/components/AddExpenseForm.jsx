import { useState, useRef } from "react";

const PRESET_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Education",
  "Other",
];

function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AddExpenseForm({ onAdd, existingCategories = [] }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    amount: "",
    category: "",
    description: "",
    date: today,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  const allCategories = [
    ...new Set([...PRESET_CATEGORIES, ...existingCategories]),
  ].sort();

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(false);
  }

  function validate() {
    const amount = parseFloat(form.amount);
    if (!form.amount || isNaN(amount) || amount <= 0)
      return "Amount must be a positive number.";
    if (!form.category) return "Please select or enter a category.";
    if (!form.description.trim()) return "Description is required.";
    if (!form.date) return "Date is required.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await onAdd(
        {
          amount: parseFloat(form.amount),
          category: form.category,
          description: form.description.trim(),
          date: form.date,
        },
        idempotencyKeyRef.current
      );
      setSuccess(true);
      setForm({ amount: "", category: "", description: "", date: today });
      // Fresh key for next submission
      idempotencyKeyRef.current = generateIdempotencyKey();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-form" onSubmit={handleSubmit} noValidate>
      <h2 className="form-title">Add Expense</h2>

      <div className="form-row">
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            disabled={submitting}
            required
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="category">Category</label>
        <input
          id="category"
          name="category"
          list="category-list"
          placeholder="Select or type a category"
          value={form.category}
          onChange={handleChange}
          disabled={submitting}
          required
          autoComplete="off"
        />
        <datalist id="category-list">
          {allCategories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <input
          id="description"
          name="description"
          type="text"
          placeholder="What did you spend on?"
          value={form.description}
          onChange={handleChange}
          disabled={submitting}
          required
          maxLength={500}
        />
      </div>

      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">Expense added successfully!</p>}

      <button className="btn-submit" type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Add Expense"}
      </button>
    </form>
  );
}
