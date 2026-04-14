import { useState } from "react";
import axios from "axios";

function App() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [people, setPeople] = useState("");
  const [preferences, setPreferences] = useState("");
  const [result, setResult] = useState("");

  const handleSubmit = async () => {
    const res = await axios.post("http://localhost:5000/plan", {
      destination,
      budget,
      people,
      preferences
    });

    setResult(JSON.stringify(res.data, null, 2));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>AI Trip Planner</h1>

      <input placeholder="Destination" onChange={(e) => setDestination(e.target.value)} />
      <input placeholder="Budget" onChange={(e) => setBudget(e.target.value)} />
      <input placeholder="People" onChange={(e) => setPeople(e.target.value)} />
      <input placeholder="Preferences" onChange={(e) => setPreferences(e.target.value)} />

      <button onClick={handleSubmit}>Plan Trip</button>

      <pre>{result}</pre>
    </div>
  );
}

export default App;