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

  // placeholder for now
  res.json({
    message: "Trip planning coming soon",
    data: { destination, budget, people, preferences }
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});