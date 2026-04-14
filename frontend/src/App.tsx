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

function HeroIllustration() {
  return (
    <svg
      className="hero-illo"
      viewBox="0 0 320 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="8" y="24" width="200" height="140" rx="12" fill="#fff" stroke="rgba(55,53,47,0.12)" />
      <rect x="24" y="44" width="88" height="10" rx="4" fill="rgba(55,53,47,0.12)" />
      <rect x="24" y="62" width="160" height="8" rx="4" fill="rgba(55,53,47,0.08)" />
      <rect x="24" y="78" width="120" height="8" rx="4" fill="rgba(55,53,47,0.08)" />
      <rect x="24" y="102" width="72" height="36" rx="8" fill="rgba(35,131,226,0.12)" stroke="rgba(35,131,226,0.25)" />
      <rect x="108" y="102" width="72" height="36" rx="8" fill="rgba(235,87,87,0.08)" stroke="rgba(235,87,87,0.2)" />
      <rect x="120" y="120" width="176" height="132" rx="14" fill="#fff" stroke="rgba(55,53,47,0.12)" />
      <circle cx="156" cy="156" r="18" fill="rgba(35,131,226,0.15)" />
      <path
        d="M148 156l6 6 12-14"
        stroke="#2383e2"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="188" y="148" width="88" height="8" rx="3" fill="rgba(55,53,47,0.1)" />
      <rect x="188" y="164" width="64" height="8" rx="3" fill="rgba(55,53,47,0.06)" />
      <rect x="140" y="196" width="136" height="40" rx="8" fill="rgba(55,53,47,0.04)" />
    </svg>
  );
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
    balanced: { label: "Balanced", icon: "⚖", desc: "Best value" },
    budget: { label: "Budget", icon: "◇", desc: "Save more" },
    luxury: { label: "Luxury", icon: "✦", desc: "Premium" },
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark" aria-hidden />
            <span className="logo-text">Planora</span>
          </div>
          <span className="header-pill">AI trip planning</span>
        </div>
      </header>

      <main className="main">
        <section className="bento-hero" aria-labelledby="hero-heading">
          <div className="bento-grid">
            <div className="bento-tile bento-tile--headline">
              <p className="eyebrow">Powered by Mistral AI</p>
              <h1 id="hero-heading" className="hero-title">
                One workspace for
                <br />
                <span className="hero-title-accent">smarter itineraries.</span>
              </h1>
              <p className="hero-lede">
                Plan trips with reasoning, tradeoffs, and assumptions — like a doc, but built for travel.
              </p>
            </div>
            <div className="bento-tile bento-tile--visual">
              <HeroIllustration />
            </div>
            <div className="bento-tile bento-tile--mini">
              <span className="mini-label">Structured output</span>
              <p className="mini-value">Days · tabs · lists</p>
            </div>
            <div className="bento-tile bento-tile--mini">
              <span className="mini-label">Your constraints</span>
              <p className="mini-value">Budget &amp; style</p>
            </div>
          </div>
        </section>

        <section className="bento-form" aria-label="Trip details">
          <div className="form-bento">
            <div className="form-row form-row--2">
              <div className="field">
                <label className="field-label" htmlFor="dest">
                  Destination
                </label>
                <input
                  id="dest"
                  className="field-input"
                  placeholder="e.g. Tokyo, Japan"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="budget">
                  Total budget
                </label>
                <input
                  id="budget"
                  className="field-input"
                  placeholder="e.g. $3,000 USD"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row form-row--2">
              <div className="field">
                <label className="field-label" htmlFor="people">
                  Travelers
                </label>
                <input
                  id="people"
                  className="field-input"
                  placeholder="e.g. 2 adults"
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label" htmlFor="prefs">
                  Preferences
                </label>
                <input
                  id="prefs"
                  className="field-input"
                  placeholder="Food, museums, nature…"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>
            </div>
            <div className="field field--full">
              <span className="field-label">Planning style</span>
              <div className="segmented" role="group" aria-label="Planning style">
                {(Object.keys(modeConfig) as PlanMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`segment ${mode === m ? "segment--active" : ""}`}
                    onClick={() => setMode(m)}
                  >
                    <span className="segment-icon">{modeConfig[m].icon}</span>
                    <span className="segment-text">
                      <span className="segment-title">{modeConfig[m].label}</span>
                      <span className="segment-desc">{modeConfig[m].desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
            {error && <div className="error-msg">{error}</div>}
            <button
              type="button"
              className={`cta ${loading ? "cta--loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="cta-inner">
                  <span className="spinner" aria-hidden />
                  Crafting your plan…
                </span>
              ) : (
                "Generate itinerary"
              )}
            </button>
          </div>
        </section>

        {result && (
          <section className="results" aria-label="Your plan">
            <div className="results-head">
              <div>
                <h2 className="results-title">
                  Trip to <span className="results-dest">{destination}</span>
                </h2>
                <div className="results-meta">
                  <span className="chip">{people}</span>
                  <span className="chip">{budget}</span>
                  <span className={`chip chip--mode chip--${mode}`}>
                    {modeConfig[mode].label}
                  </span>
                </div>
              </div>
            </div>

            <div className="tabs-wrap">
              <nav className="tabs" role="tablist">
                {[
                  { id: "itinerary", label: "Itinerary", count: itineraryDays.length > 0 ? `${itineraryDays.length}d` : null },
                  { id: "reasoning", label: "Reasoning", count: null },
                  { id: "tradeoffs", label: "Tradeoffs", count: tradeoffList.length > 0 ? String(tradeoffList.length) : null },
                  { id: "assumptions", label: "Assumptions", count: assumptionList.length > 0 ? String(assumptionList.length) : null },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeSection === tab.id}
                    className={`tab ${activeSection === tab.id ? "tab--active" : ""}`}
                    onClick={() => setActiveSection(tab.id)}
                  >
                    {tab.label}
                    {tab.count && <span className="tab-badge">{tab.count}</span>}
                  </button>
                ))}
              </nav>
            </div>

            {activeSection === "itinerary" && (
              <div className="panel">
                {itineraryDays.length > 0 ? (
                  <div className="timeline">
                    {itineraryDays.map((day, i) => (
                      <div key={i} className="day-row">
                        <div className="day-badge">
                          {(day as { dayNum?: string }).dayNum || String(i + 1)}
                        </div>
                        <div className="day-panel">
                          <h3 className="day-title">{(day as { title: string }).title}</h3>
                          <div className="day-body">
                            {day.content.split("\n").filter(Boolean).map((activity, j) => (
                              <p key={j} className="day-line">
                                {activity}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="pre">{result.itinerary}</div>
                )}
              </div>
            )}

            {activeSection === "reasoning" && (
              <div className="panel panel--prose">
                {result.reasoning.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            )}

            {activeSection === "tradeoffs" && (
              <div className="panel">
                <p className="panel-intro">How priorities were balanced for this plan.</p>
                <div className="grid-2">
                  {tradeoffList.length > 0 ? (
                    tradeoffList.map((item, i) => {
                      const colonIdx = item.indexOf(":");
                      const hasColon = colonIdx > -1 && colonIdx < 60;
                      return (
                        <div key={i} className="mini-card">
                          {hasColon ? (
                            <>
                              <strong className="mini-card-title">{item.slice(0, colonIdx)}</strong>
                              <p className="mini-card-body">{item.slice(colonIdx + 1).trim()}</p>
                            </>
                          ) : (
                            <p className="mini-card-body">{item}</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="pre pre--full">{result.tradeoffs}</div>
                  )}
                </div>
              </div>
            )}

            {activeSection === "assumptions" && (
              <div className="panel">
                <p className="panel-intro">Assumptions baked into this itinerary — tweak inputs if needed.</p>
                <ul className="assump-list">
                  {assumptionList.length > 0 ? (
                    assumptionList.map((item, i) => (
                      <li key={i} className="assump-row">
                        <span className="assump-num">{i + 1}</span>
                        <span>{item}</span>
                      </li>
                    ))
                  ) : (
                    <li className="assump-row assump-row--plain">
                      <div className="pre">{result.assumptions}</div>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="footer">
        <p>Planora — AI travel planning</p>
      </footer>
    </div>
  );
}
