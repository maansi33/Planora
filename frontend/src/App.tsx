import { useState } from "react";
import axios from "axios";
import "./App.css";

type PlanResult = {
  itinerary: string;
  reasoning: string;
  tradeoffs: string;
  assumptions: string;
};

type PlanMode = "balanced" | "budget" | "luxury";

function parseItinerary(text: string) {
  const days = text.split(/\n\n(?=DAY \d+)/i).filter(Boolean);
  if (days.length <= 1) {
    // Fallback: split by double newline
    return text.split(/\n\n/).filter(Boolean).map((block, i) => ({
      title: `Day ${i + 1}`,
      content: block.trim(),
    }));
  }
  return days.map((day) => {
    const lines = day.trim().split("\n");
    const titleLine = lines[0];
    const title = titleLine.replace(/^DAY \d+:\s*/i, "").trim() || titleLine;
    const dayNum = titleLine.match(/DAY (\d+)/i)?.[1] || String(days.indexOf(day) + 1);
    const content = lines.slice(1).join("\n").trim();
    return { dayNum, title, content };
  });
}

function parseList(text: string) {
  return text
    .split(/\n/)
    .map((l) => l.replace(/^[•\-\*]\s*/, "").trim())
    .filter(Boolean);
}

export default function App() {
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("");
  const [people, setPeople] = useState("");
  const [preferences, setPreferences] = useState("");
  const [mode, setMode] = useState<PlanMode>("balanced");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<string>("itinerary");

  const handleSubmit = async () => {
    if (!destination || !budget || !people) {
      setError("Please fill in destination, budget, and number of travelers.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post("http://localhost:5000/plan", {
        destination,
        budget,
        people,
        preferences,
        mode,
      });
      setResult(res.data.result);
      setActiveSection("itinerary");
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err)
          ? err.response?.data?.error || "Failed to connect to server."
          : "Unexpected error.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const itineraryDays = result ? parseItinerary(result.itinerary) : [];
  const tradeoffList = result ? parseList(result.tradeoffs) : [];
  const assumptionList = result ? parseList(result.assumptions) : [];

  const modeConfig = {
    balanced: { label: "Balanced", icon: "⚖️", desc: "Best value for money" },
    budget: { label: "Budget-Friendly", icon: "💸", desc: "Maximum savings" },
    luxury: { label: "Luxury", icon: "✨", desc: "Premium experiences" },
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">✈</span>
            <span className="logo-text">Planora</span>
          </div>
          <p className="logo-tagline">AI-Powered Travel Intelligence</p>
        </div>
      </header>

      <main className="main">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge">Powered by Mistral AI</div>
          <h1 className="hero-title">
            Plan Smarter.<br />
            <span className="hero-accent">Travel Better.</span>
          </h1>
          <p className="hero-subtitle">
            Get a full AI-generated itinerary with reasoning, tradeoffs, and
            assumptions — not just a list of places.
          </p>
        </section>

        {/* Form Card */}
        <section className="form-card">
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">
                <span className="input-icon">📍</span> Destination
              </label>
              <input
                className="input"
                placeholder="e.g. Tokyo, Japan"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <span className="input-icon">💰</span> Total Budget
              </label>
              <input
                className="input"
                placeholder="e.g. $3,000 USD"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <span className="input-icon">👥</span> Travelers
              </label>
              <input
                className="input"
                placeholder="e.g. 2 adults"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label className="input-label">
                <span className="input-icon">🎯</span> Preferences
              </label>
              <input
                className="input"
                placeholder="e.g. food, history, nature, nightlife"
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
              />
            </div>
          </div>

          {/* Mode Toggle */}
          <div className="mode-section">
            <p className="mode-label">Planning Style</p>
            <div className="mode-toggle">
              {(Object.keys(modeConfig) as PlanMode[]).map((m) => (
                <button
                  key={m}
                  className={`mode-btn ${mode === m ? "mode-btn-active" : ""}`}
                  onClick={() => setMode(m)}
                >
                  <span className="mode-btn-icon">{modeConfig[m].icon}</span>
                  <span className="mode-btn-label">{modeConfig[m].label}</span>
                  <span className="mode-btn-desc">{modeConfig[m].desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button
            className={`plan-btn ${loading ? "plan-btn-loading" : ""}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span className="loading-inner">
                <span className="spinner" />
                Crafting your itinerary...
              </span>
            ) : (
              <span>✈ Plan My Trip</span>
            )}
          </button>
        </section>

        {/* Results */}
        {result && (
          <section className="results">
            <div className="results-header">
              <h2 className="results-title">
                Your Trip to <span className="results-dest">{destination}</span>
              </h2>
              <div className="results-meta">
                <span className="meta-tag">{people} travelers</span>
                <span className="meta-tag">{budget}</span>
                <span className={`meta-tag meta-tag-mode meta-tag-${mode}`}>
                  {modeConfig[mode].icon} {modeConfig[mode].label}
                </span>
              </div>
            </div>

            {/* Tab Nav */}
            <nav className="tab-nav">
              {[
                { id: "itinerary", label: "📅 Itinerary", count: itineraryDays.length > 0 ? `${itineraryDays.length} days` : null },
                { id: "reasoning", label: "🧠 Reasoning", count: null },
                { id: "tradeoffs", label: "⚡ Tradeoffs", count: tradeoffList.length > 0 ? `${tradeoffList.length} items` : null },
                { id: "assumptions", label: "📌 Assumptions", count: assumptionList.length > 0 ? `${assumptionList.length} items` : null },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeSection === tab.id ? "tab-btn-active" : ""}`}
                  onClick={() => setActiveSection(tab.id)}
                >
                  {tab.label}
                  {tab.count && <span className="tab-count">{tab.count}</span>}
                </button>
              ))}
            </nav>

            {/* Itinerary Section */}
            {activeSection === "itinerary" && (
              <div className="section-content">
                {itineraryDays.length > 0 ? (
                  <div className="timeline">
                    {itineraryDays.map((day, i) => (
                      <div key={i} className="day-card">
                        <div className="day-marker">
                          <div className="day-num">{(day as { dayNum?: string }).dayNum || i + 1}</div>
                          {i < itineraryDays.length - 1 && <div className="day-line" />}
                        </div>
                        <div className="day-content">
                          <h3 className="day-title">{(day as { title: string }).title}</h3>
                          <div className="day-activities">
                            {day.content.split("\n").filter(Boolean).map((activity, j) => (
                              <p key={j} className="activity">{activity}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="plain-content">{result.itinerary}</div>
                )}
              </div>
            )}

            {/* Reasoning Section */}
            {activeSection === "reasoning" && (
              <div className="section-content">
                <div className="reasoning-card">
                  <div className="reasoning-icon">🧠</div>
                  <div className="reasoning-text">
                    {result.reasoning.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Tradeoffs Section */}
            {activeSection === "tradeoffs" && (
              <div className="section-content">
                <p className="section-intro">
                  Here's how the AI balanced competing priorities when building your plan:
                </p>
                <div className="tradeoffs-grid">
                  {tradeoffList.length > 0 ? (
                    tradeoffList.map((item, i) => {
                      const colonIdx = item.indexOf(":");
                      const hasColon = colonIdx > -1 && colonIdx < 60;
                      return (
                        <div key={i} className="tradeoff-card">
                          <div className="tradeoff-icon">⚡</div>
                          <div className="tradeoff-body">
                            {hasColon ? (
                              <>
                                <strong className="tradeoff-title">
                                  {item.slice(0, colonIdx)}
                                </strong>
                                <p className="tradeoff-desc">
                                  {item.slice(colonIdx + 1).trim()}
                                </p>
                              </>
                            ) : (
                              <p className="tradeoff-desc">{item}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="plain-content">{result.tradeoffs}</div>
                  )}
                </div>
              </div>
            )}

            {/* Assumptions Section */}
            {activeSection === "assumptions" && (
              <div className="section-content">
                <p className="section-intro">
                  The AI made these assumptions when generating your plan. Adjust your inputs if any don't apply.
                </p>
                <div className="assumptions-list">
                  {assumptionList.length > 0 ? (
                    assumptionList.map((item, i) => (
                      <div key={i} className="assumption-item">
                        <span className="assumption-num">{i + 1}</span>
                        <p className="assumption-text">{item}</p>
                      </div>
                    ))
                  ) : (
                    <div className="plain-content">{result.assumptions}</div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Planora &copy; 2025 &mdash; AI Travel Planning, Reimagined</p>
      </footer>
    </div>
  );
}