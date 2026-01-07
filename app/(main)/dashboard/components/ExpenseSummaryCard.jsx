"use client";

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ExpenseSummaryCard() {
  const [data, setData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ✅ Convex ACTION
  const generateSummary = useAction(
    api.expenses.getMonthlyExpenseSummaryAction
  );

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const result = await generateSummary({ month, year });

      setData(result.data);
      setAiSummary(result.aiSummary);
    } catch (err) {
      console.error(err);
      setError("Summary unavailable right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="rounded-xl border bg-background p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Monthly Summary</h2>
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* States */}
      {loading && (
        <p className="text-sm text-muted-foreground">
          Loading summary...
        </p>
      )}

      {error && (
        <p className="text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && data && (
        <>
          {/* Period */}
          <p className="text-sm text-muted-foreground">
            {data.period}
          </p>

          {/* Key numbers */}
          <div className="text-sm">
            <span className="font-medium">
              ₹{data.totalSpent}
            </span>{" "}
            spent • {data.expenseCount} expenses
          </div>

          {/* Top categories */}
          {data.topCategories && data.topCategories.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium">
                Top categories
              </p>
              {data.topCategories.map(cat => (
                <div
                  key={cat.name}
                  className="flex justify-between text-sm text-muted-foreground"
                >
                  <span>{cat.name}</span>
                  <span>₹{cat.amount}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Insight */}
          {aiSummary && (
            <div className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
            <span className="font-medium">💡 Insight</span>
            <p className="mt-1 text-muted-foreground">{aiSummary}</p>
          </div>          
          )}
        </>
      )}
    </div>
  );
}
