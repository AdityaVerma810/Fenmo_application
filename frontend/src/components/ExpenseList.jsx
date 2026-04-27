export function ExpenseList({ expenses, loading, error }) {
  if (loading) {
    return (
      <div className="list-state">
        <div className="skeleton-rows">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="list-state error-state">
        <span className="state-icon">⚠</span>
        <p>{error}</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="list-state empty-state">
        <span className="state-icon">₹</span>
        <p>No expenses found. Add your first one!</p>
      </div>
    );
  }

  return (
    <div className="expense-table-wrap">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th className="amount-col">Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id}>
              <td className="date-cell">{formatDate(e.date)}</td>
              <td>
                <span className="category-badge">{e.category}</span>
              </td>
              <td className="desc-cell">{e.description}</td>
              <td className="amount-cell">₹{Number(e.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
