import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/", (req, res) => {
  res.send("Planora API running");
});

app.post("/plan", async (req, res) => {
  const { destination, budget, people, preferences, mode } = req.body;

  if (!destination || !budget || !people) {
    return res.status(400).json({ error: "Missing required fields: destination, budget, people" });
  }

  const modeInstruction =
    mode === "luxury"
      ? "Prioritize premium experiences, luxury hotels, fine dining, and exclusive activities. Don't worry about cost savings — optimize for the best possible experience."
      : mode === "budget"
      ? "Aggressively optimize for cost savings. Find free activities, affordable hostels or budget hotels, street food, public transit, and hidden local gems. Every dollar must count."
      : "Balance cost and experience. Find the sweet spot between value and quality.";

  const prompt = `You are an expert travel planner with deep knowledge of destinations worldwide.

Trip details:
- Destination: ${destination}
- Total Budget: ${budget}
- Number of Travelers: ${people}
- Preferences/Interests: ${preferences || "General sightseeing"}
- Planning Mode: ${mode || "balanced"} — ${modeInstruction}

Generate a detailed, realistic travel plan. You MUST return ONLY a valid JSON object with exactly these four keys. Do not include any text before or after the JSON.

{
  "itinerary": "A detailed day-by-day plan. Format each day as: DAY 1: [Title]\\n[Morning activity with specific name and brief description]\\n[Afternoon activity]\\n[Evening activity with dinner recommendation]\\n\\nDAY 2: [Title]\\n... (continue for all days based on trip length implied by budget and destination)",
  "reasoning": "2-3 paragraphs explaining WHY you chose these specific activities, accommodations, and routes. Reference the traveler count (${people} people), budget (${budget}), and preferences. Explain the logic behind the sequencing of days.",
  "tradeoffs": "List 4-6 specific tradeoffs in this format: • [Trade-off title]: [Explanation of the cost vs benefit decision made]\\n• [Next trade-off]...",
  "assumptions": "List 3-5 assumptions made in bullet format: • [Assumption]\\n• [Next assumption]..."
}

Be specific with real place names, restaurants, attractions. Make the plan feel hand-crafted, not generic.`;

  try {
    const completion = await client.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        {
          role: "system",
          content:
            "You are a professional travel planner. Always respond with ONLY valid JSON — no preamble, no explanation outside the JSON. The JSON must have exactly four string keys: itinerary, reasoning, tradeoffs, assumptions.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const raw = completion.choices[0].message.content;

    // Extract JSON robustly
    let parsed;
    try {
      // Try direct parse first
      parsed = JSON.parse(raw);
    } catch {
      // Try to extract JSON from markdown code blocks or surrounding text
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from response");
      }
    }

    // Validate required keys
    const required = ["itinerary", "reasoning", "tradeoffs", "assumptions"];
    for (const key of required) {
      if (!parsed[key]) {
        parsed[key] = "Information not available for this section.";
      }
    }

    res.json({ result: parsed });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Failed to generate travel plan. Please try again." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Planora server running on port ${PORT}`);
});