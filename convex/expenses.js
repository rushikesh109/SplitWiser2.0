import { mutation, query , action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create a new expense
export const createExpense = mutation({
  args: {
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"),
    splitType: v.string(), // "equal", "percentage", "exact"
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
    // Use centralized getCurrentUser function
    const user = await ctx.runQuery(internal.users.getCurrentUser);

    // If there's a group, verify the user is a member
    if (args.groupId) {
      const group = await ctx.db.get(args.groupId);
      if (!group) {
        throw new Error("Group not found");
      }

      const isMember = group.members.some(
        (member) => member.userId === user._id
      );
      if (!isMember) {
        throw new Error("You are not a member of this group");
      }
    }

    // Verify that splits add up to the total amount (with small tolerance for floating point issues)
    const totalSplitAmount = args.splits.reduce(
      (sum, split) => sum + split.amount,
      0
    );
    const tolerance = 0.01; // Allow for small rounding errors
    if (Math.abs(totalSplitAmount - args.amount) > tolerance) {
      throw new Error("Split amounts must add up to the total expense amount");
    }

    // Create the expense
    const expenseId = await ctx.db.insert("expenses", {
      description: args.description,
      amount: args.amount,
      category: args.category || "Other",
      date: args.date,
      paidByUserId: args.paidByUserId,
      splitType: args.splitType,
      splits: args.splits,
      groupId: args.groupId,
      createdBy: user._id,
    });

    return expenseId;
  },
});

export const getExpensesBetweenUsers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const me = await ctx.runQuery(internal.users.getCurrentUser);
    if (me._id === userId) throw new Error("Cannot query yourself");

    const mypaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", me._id).eq("groupId", undefined)
      )
      .collect();

    const theirPaid = await ctx.db
      .query("expenses")
      .withIndex("by_user_and_group", (q) =>
        q.eq("paidByUserId", userId).eq("groupId", undefined)
      )
      .collect();

    const candidateExpenses = [...mypaid, ...theirPaid];

    const expenses = candidateExpenses.filter((e) => {
      const meInSplits = e.splits.some((s) => s.userId === me._id);
      const themInSplits = e.splits.some((s) => s.userId === userId);
      const meInvolved = e.paidByUserId === me._id || meInSplits;
      const themInvolved = e.paidByUserId === userId || themInSplits;
      return meInvolved && themInvolved;
    });

    expenses.sort((a, b) => b.date - a.date);

    const settlements = await ctx.db
      .query("settlements")
      .filter((q) =>
        q.and(
          q.eq(q.field("groupId"), undefined),
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

    settlements.sort((a, b) => b.date - a.date);

    let balance = 0;
    for await (const e of expenses) {
      if (e.paidByUserId === me._id) {
        const split = e.splits.find((s) => s.userId === userId && !s.paid);
        if (split) balance += split.amount;
      } else {
        const split = e.splits.find((s) => s.userId === me._id && !s.paid);
        if (split) balance -= split.amount;
      }
    }

    for (const s of settlements) {
      if (s.paidByUserId === me._id) balance += s.amount;
      else balance -= s.amount;
    }

    const other = await ctx.db.get(userId);
    if (!other) throw new Error("User not found");

    return {
      expenses,
      settlements,
      otherUser: {
        id: other._id,
        name: other.name,
        email: other.email,
        imageUrl: other.imageUrl,
      },
      balance,
    };
  },
});

export const deleteExpense = mutation({
  args: {
    expenseId: v.id("expenses"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense) throw new Error("Expense not found");

    if (
      expense.createdBy !== user._id &&
      expense.paidByUserId !== user._id
    ) {
      throw new Error("You don't have permission to delete this expense");
    }

    await ctx.db.delete(args.expenseId);
    return { success: true };
  },
});

export const getMonthlyExpenseSummaryQuery = query({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const start = new Date(year, month - 1, 1).getTime();
    const end = new Date(year, month, 1).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", q =>
        q.gte("date", start).lt("date", end)
      )
      .filter(q => q.eq(q.field("createdBy"), user._id))
      .collect();

    const totalSpent = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    const expenseCount = expenses.length;

    const categoryMap = {};
    for (const e of expenses) {
      const category = e.category || "Other";
      categoryMap[category] =
        (categoryMap[category] || 0) + (e.amount || 0);
    }

    const topCategories = Object.entries(categoryMap)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 2);

    let userPaid = 0;
    let othersPaid = 0;

    for (const e of expenses) {
      if (String(e.paidByUserId) === String(user._id)) {
        userPaid += e.amount || 0;
      } else {
        othersPaid += e.amount || 0;
      }
    }

    const paidMoreThanOthers = userPaid > othersPaid;

    return {
      period: `${new Date(year, month - 1).toLocaleString("en-US", {
        month: "long",
      })} ${year}`,
      currency: "INR",
      totalSpent,
      expenseCount,
      topCategories,
      paidMoreThanOthers,
    };
  },
});


export const getMonthlyExpenseSummaryAction = action({
  args: {
    month: v.number(),
    year: v.number(),
  },
  handler: async (ctx, { month, year }) => {
    // 1️⃣ Call QUERY (DB work)
    const summaryData = await ctx.runQuery(
      "expenses:getMonthlyExpenseSummaryQuery",
      { month, year }
    );
    // 2️⃣ Gemini AI
    let aiSummary = "AI insights are temporarily unavailable. Showing data summary instead.";

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: `You are a financial insights assistant.
Use only the data below.
Max 5 sentences.

${JSON.stringify(summaryData, null, 2)}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const json = await response.json();
          aiSummary =
            json?.candidates?.[0]?.content?.parts?.[0]?.text ||
            aiSummary;
        }
        
      } catch (err) {
        console.error("Gemini error:", err);
      }
    }

    return {
      data: summaryData,
      aiSummary,
    };
  },
});
