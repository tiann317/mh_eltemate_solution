import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { Assessment } from "../types";
import "./NewIncident.css";

export default function NewIncident() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Assessment | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      const assessment = await api.assess(message);
      setResult(assessment);
      const inc = await api.createIncident({
        title: title || message.slice(0, 60),
        summary: message,
        assessment: assessment as unknown as Record<string, unknown>,
      });
      await api.createLog(inc.id, "Incident created and assessed via LDA");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Report a new incident</h2>
      <div className="card">
        <label htmlFor="title">Title (optional)</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short title"
        />
        <div style={{ height: 12 }} />
        <label htmlFor="msg">Describe what happened</label>
        <textarea
          id="msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Personal data, systems involved, time of discovery, sector..."
        />
        <div style={{ height: 12 }} />
        <div className="row">
          <span className="muted">Sent to LDA Legal Data Hub for legal reasoning.</span>
          <span className="spacer" />
          <button
            className="btn"
            onClick={submit}
            disabled={loading || message.trim().length === 0}
          >
            {loading ? "Assessing..." : "Assess incident"}
          </button>
        </div>
        {error && <p style={{ color: "var(--danger)", marginTop: 12 }}>{error}</p>}
      </div>

      {result && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Legal assessment</h3>
          <div
            className="assessment"
            dangerouslySetInnerHTML={{ __html: result.answer }}
          />
          {result.sources.length > 0 && (
            <div className="sources">
              <strong>Sources</strong>
              {result.sources.map((s, i) => {
                const m = s.metadata as { source?: string; oso_url?: string };
                return (
                  <div className="source-item" key={i}>
                    {m.source ?? `Source ${i + 1}`}
                    {m.oso_url && (
                      <>
                        {" "}
                        — <a href={m.oso_url} target="_blank" rel="noreferrer">link</a>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <button className="btn-ghost btn" onClick={() => navigate("/dashboard")}>
              Go to dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
