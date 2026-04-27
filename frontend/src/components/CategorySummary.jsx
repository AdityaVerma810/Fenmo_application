export function CategorySummary({ expenses }) {
  if (!expenses || expenses.length === 0) return null;

  const summary = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  const sorted = Object.entries(summary).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];

  return (
    <div className="summary-section">
      <h3 className="summary-title">By Category</h3>
      <div className="summary-bars">
        {sorted.map(([cat, total]) => (
          <div key={cat} className="summary-bar-row">
            <span className="summary-cat">{cat}</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${(total / max) * 100}%` }}
              />
            </div>
            <span className="summary-amt">
              ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
