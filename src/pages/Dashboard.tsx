import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { Incident } from "../types";
import "./Dashboard.css";

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listIncidents()
      .then(setIncidents)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container">
      <h2>Incidents</h2>
      {loading && <p className="muted">Loading...</p>}
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {!loading && incidents.length === 0 && (
        <p className="muted">No incidents yet. Report one from the form.</p>
      )}
      {incidents.length > 0 && (
        <div className="card">
          {incidents.map((i) => (
            <div className="incident-row" key={i.id}>
              <div>
                <div className="incident-title">
                  <Link to={`/incident/${i.id}`}>{i.title}</Link>
                </div>
                <div className="muted">
                  {new Date(i.created_at).toLocaleString()}
                </div>
              </div>
              {i.risk_rating && (
                <span className={`badge ${i.risk_rating}`}>{i.risk_rating}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
