import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
  try {
    console.log("STEP 1: API called");

    const { userId } = await auth();
    console.log("STEP 2: userId =", userId);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { month, year } = await req.json();
    console.log("STEP 3: month/year =", month, year);

    // ---- QUERY ----
    const summaryData = await convex.query(
      api.expenses.getMonthlyExpenseSummary,
      { month, year }
    );
    console.log("STEP 4: summaryData =", summaryData);

    // ---- ACTION ----
    const aiSummary = await convex.action(
      api.ai.generateExpenseSummary,
      { summaryData }
    );
    console.log("STEP 5: aiSummary =", aiSummary);

    return Response.json({
      data: summaryData,
      aiSummary,
    });
  } catch (err) {
    console.error("EXPENSE SUMMARY ERROR:", err);
    return Response.json(
      { error: "Server error while generating expense summary." },
      { status: 500 }
    );
  }
}
