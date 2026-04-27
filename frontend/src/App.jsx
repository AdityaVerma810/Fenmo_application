import { useExpenses } from "./hooks/useExpenses";
import { AddExpenseForm } from "./components/AddExpenseForm";
import { ExpenseList } from "./components/ExpenseList";
import { CategorySummary } from "./components/CategorySummary";

export default function App() {
  const {
    expenses,
    categories,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    addExpense,
    total,
  } = useExpenses();

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">₹</span>
            <span className="logo-text">PaisaTrack</span>
          </div>
          <p className="tagline">Know where every rupee goes</p>
        </div>
      </header>

      <main className="main">
        <aside className="sidebar">
          <AddExpenseForm onAdd={addExpense} existingCategories={categories} />
          <CategorySummary expenses={expenses} />
        </aside>

        <section className="content">
          <div className="controls-bar">
            <div className="control-group">
              <label htmlFor="filter-cat">Category</label>
              <select
                id="filter-cat"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label htmlFor="sort-sel">Sort</label>
              <select
                id="sort-sel"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
              </select>
            </div>

            <div className="total-chip">
              Total&nbsp;
              <strong>
                ₹{Number(total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </strong>
            </div>
          </div>

          <ExpenseList expenses={expenses} loading={loading} error={error} />
        </section>
      </main>
    </div>
  );
}
