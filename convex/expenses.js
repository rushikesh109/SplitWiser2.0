import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* ---------------- CREATE EXPENSE ---------------- */

export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(),
    paidByUserId: v.id("users"),
    splitType: v.string(),
    splits: v.array(
      v.object({
        userId: v.id("users"),
        amount: v.number(),
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")),
  },

  handler: async (ctx, args) => {
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    let group = null;

    // 1️⃣ Validate group membership
    if (args.groupId) {
      group = await ctx.db.get(args.groupId);
      if (!group) throw new Error("Group not found");

      const isMember = group.members.some(
        (m) => m.userId === currentUser._id
      );
      if (!isMember) throw new Error("You are not a group member");
    }

    // 2️⃣ Validate payer
    if (args.groupId) {
      const payerIsMember = group.members.some(
        (m) => m.userId === args.paidByUserId
      );
      if (!payerIsMember) {
        throw new Error("Paid-by user is not part of the group");
      }
    } else if (args.paidByUserId !== currentUser._id) {
      throw new Error("You can only pay personal expenses yourself");
    }

    // 3️⃣ Validate split users
    for (const split of args.splits) {
      if (args.groupId) {
        const validUser = group.members.some(
          (m) => m.userId === split.userId
        );
        if (!validUser) {
          throw new Error("Split user not in group");
        }
      }
    }

    // 4️⃣ Validate split total
    const totalSplit = args.splits.reduce(
      (sum, s) => sum + s.amount,
      0
    );

    if (Math.abs(totalSplit - args.amount) > 0.01) {
      throw new Error("Split amounts must equal total amount");
    }

    // 5️⃣ Create expense
    return await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category ?? "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId ?? null,
      createdBy: currentUser._id,
    });
  },
});

/* ---------------- USER TO USER EXPENSES ---------------- */

export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },

  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (me._id === userId) throw new Error("Invalid user");

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_group", (q) => q.eq("groupId", null))
      .collect();

    const filtered = expenses.filter((e) => {
      const meIn = e.paidByUserId === me._id ||
        e.splits.some(s => s.userId === me._id);
      const themIn = e.paidByUserId === userId ||
        e.splits.some(s => s.userId === userId);
      return meIn && themIn;
    });

    filtered.sort((a, b) => b.date - a.date);

    const settlements = await ctx.db
      .query("settlements")
      .filter(q =>
        q.and(
          q.eq(q.field("groupId"), null),
          q.or(
            q.and(
              q.eq(q.field("paidByUserId"), me._id),
              q.eq(q.field("receivedByUserId"), userId)
            ),
            q.and(
              q.eq(q.field("paidByUserId"), userId),
              q.eq(q.field("receivedByUserId"), me._id)
            )
          )
        )
      )
      .collect();

    let balance = 0;

    for (const e of filtered) {
      if (e.paidByUserId === me._id) {
        const owed = e.splits.find(
          s => s.userId === userId && !s.paid
        );
        if (owed) balance += owed.amount;
      } else {
        const iOwe = e.splits.find(
          s => s.userId === me._id && !s.paid
        );
        if (iOwe) balance -= iOwe.amount;
      }
    }

    for (const s of settlements) {
      balance += s.paidByUserId === me._id ? s.amount : -s.amount;
    }

    const otherUser = await ctx.db.get(userId);
    if (!otherUser) throw new Error("User not found");

    return {
      expenses: filtered,
      settlements,
      balance,
      otherUser: {
        id: otherUser._id,
        name: otherUser.name,
        email: otherUser.email,
        imageUrl: otherUser.imageUrl,
      },
    };
  },
});

/* ---------------- DELETE EXPENSE ---------------- */

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },

  handler: async (ctx, { expenseId }) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    const expense = await ctx.db.get(expenseId);

    if (!expense) throw new Error("Expense not found");

    if (
      expense.createdBy !== user._id &&
      expense.paidByUserId !== user._id
    ) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(expenseId);
    return { success: true };
  },
});

/* ---------------- MONTHLY SUMMARY QUERY ---------------- */

export const getMonthlyExpenseSummaryQuery = query({
  args: {
    month: v.number(),
    year: v.number(),
  },

  handler: async (ctx, { month, year }) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", q =>
        q.gte("date", start).lt("date", end)
      )
      .filter(q => q.eq(q.field("createdBy"), user._id))
      .collect();

    const categoryTotals = {};
    let totalSpent = 0;

    for (const e of expenses) {
      totalSpent += e.amount;
      const cat = e.category ?? "Other";
      categoryTotals[cat] = (categoryTotals[cat] ?? 0) + e.amount;
    }

    const topCategories = Object.entries(categoryTotals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2);

    return {
      period: `${new Date(year, month - 1).toLocaleString("en-US", {
        month: "long",
      })} ${year}`,
      currency: "INR",
      totalSpent,
      expenseCount: expenses.length,
      topCategories,
    };
  },
});

/* ---------------- AI SUMMARY ACTION ---------------- */

export const getMonthlyExpenseSummaryAction = action({
  args: {
    month: v.number(),
    year: v.number(),
  },

  handler: async (ctx, args) => {
    const data = await ctx.runQuery(
      "expenses:getMonthlyExpenseSummaryQuery",
      args
    );

    let aiSummary =
      "AI insights are temporarily unavailable.";

    if (process.env.GEMINI_API_KEY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{
                    text: `Give max 5 factual financial insights using only this data:\n${JSON.stringify(data)}`
                  }]
                }
              ]
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          aiSummary =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ??
            aiSummary;
        }
      } catch {
        // fallback already handled
      }
    }

    return { data, aiSummary };
  },
});
