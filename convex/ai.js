import { action } from "./_generated/server";  // 👈 This imports the Convex server-side helper
import { v } from "convex/values";              // 👈 Validator for input checking

// This action is exposed to the frontend (via api or internal usage)
export const askGemini = action({
  // 1️⃣ Expecting a `question` as input from frontend
  args: { question: v.string() },

  // 2️⃣ Handler: what should happen when this action is called
  handler: async (ctx, { question }) => {
    const apiKey = process.env.GEMINI_API_KEY;

    // 3️⃣ Check: If no Gemini key in .env, return error
    if (!apiKey) {
      return { error: "Missing Gemini API key in Convex environment." };
    }

    // 4️⃣ Make POST request to Gemini API with your prompt
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
       text: `
You are a helpful AI chatbot for an app called SplitWiser (not Splitwise). Your job is to answer questions in a **friendly, human, concise, and chat-like tone**.

**Rules**:
- Use **Markdown** for formatting (like **bold**, lists, line breaks)
- Keep answers short (max 3 lines per paragraph)
- Break steps into **numbered lists**
- Use **newlines** naturally instead of using \\\\n
- Never mention any app other than SplitWiser

**Example format**:
1. Do this step  
2. Then this one 🎉  
3. That’s it!

Now answer this user question in that style:

${question}
`

      }
    ]
  }
]

        }),
        }
        );
    // 5️⃣ If request failed (rate limit, bad key), return error
    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini error:", errText);
      return { error: errText };
    }

    // 6️⃣ Extract the reply text from Gemini's response
    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "No reply";

    // 7️⃣ Return the final bot reply to frontend
    return { reply };
  },
});
