"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function ExpenseSummary({ monthlySpending, totalSpent }) {
  // Month labels
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Prepare chart data (net share per month)
  const chartData =
    monthlySpending?.map((item) => {
      const date = new Date(item.month);
      return {
        name: monthNames[date.getMonth()],
        amount: item.total,
      };
    }) || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const monthAmount =
    monthlySpending?.[currentMonth]?.total ?? 0;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>Your Expense Share</CardTitle>
        <p className="text-xs text-muted-foreground">
          Based on your share after splits and settlements
        </p>
      </CardHeader>

      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Your net share this month
            </p>
            <h3 className="text-2xl font-bold mt-1">
              ₹{monthAmount.toFixed(2)}
            </h3>
          </div>

          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Your net share this year
            </p>
            <h3 className="text-2xl font-bold mt-1">
              ₹{(totalSpent ?? 0).toFixed(2)}
            </h3>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`₹${value.toFixed(2)}`, "Amount"]}
                labelFormatter={() => "Your share"}
              />
              <Bar
                dataKey="amount"
                fill="#36d7b7"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-2">
          Your monthly expense share for {currentYear}
        </p>
      </CardContent>
    </Card>
  );
}
