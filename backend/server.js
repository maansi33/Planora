import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API running");
});

app.post("/plan", async (req, res) => {
  const { destination, budget, people, preferences } = req.body;

  try {
    const prompt = `
You are an AI travel planner.

User details:
- Destination: ${destination}
- Budget: ${budget}
- Number of people: ${people}
- Preferences: ${preferences}

Generate a structured travel plan with:

1. Itinerary (day-by-day)
2. Reasoning (why each choice was made)
3. Tradeoffs (cost vs experience, distance, time, etc.)
4. Assumptions

Respond ONLY in valid JSON:
{
  "itinerary": "...",
  "reasoning": "...",
  "tradeoffs": "...",
  "assumptions": "..."
}
`;

    const completion = await client.chat.completions.create({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        { role: "system", content: "You are a structured and analytical planner." },
        { role: "user", content: prompt },
      ],
    });

    const output = completion.choices[0].message.content;

    res.json({ result: output });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});