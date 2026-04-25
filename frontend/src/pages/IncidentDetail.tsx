import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import type { Assessment, AuditLog, Incident } from "../types";
import "./IncidentDetail.css";

export default function IncidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.getIncident(id), api.listLogs(id)])
      .then(([inc, ls]) => {
        setIncident(inc);
        setLogs(ls);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed"));
  }, [id]);

  const remove = async () => {
    if (!id || !confirm("Delete this incident?")) return;
    await api.deleteIncident(id);
    navigate("/dashboard");
  };

  if (error) return <div className="container"><p style={{ color: "var(--danger)" }}>{error}</p></div>;
  if (!incident) return <div className="container"><p className="muted">Loading...</p></div>;

  const assessment = incident.assessment as Assessment | null;

  return (
    <div className="container">
      <div className="row">
        <h2 style={{ margin: 0 }}>{incident.title}</h2>
        <span className="spacer" />
        <button className="btn btn-danger" onClick={remove}>Delete</button>
      </div>
      <p className="muted">Created {new Date(incident.created_at).toLocaleString()}</p>

      {incident.summary && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Description</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{incident.summary}</p>
        </div>
      )}

      {assessment?.answer && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Legal assessment</h3>
          <div dangerouslySetInnerHTML={{ __html: assessment.answer }} />
        </div>
      )}

      {assessment?.sources && assessment.sources.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Sources</h3>
          {assessment.sources.map((s, i) => {
            const m = s.metadata as { source?: string; oso_url?: string };
            return (
              <div key={i} className="muted" style={{ marginBottom: 8 }}>
                {m.source ?? `Source ${i + 1}`}
                {m.oso_url && (
                  <> — <a href={m.oso_url} target="_blank" rel="noreferrer">link</a></>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Audit log</h3>
        {logs.length === 0 && <p className="muted">No entries.</p>}
        {logs.map((l) => (
          <div className="log-entry" key={l.id}>
            [{new Date(l.created_at).toLocaleString()}] {l.message}
          </div>
        ))}
      </div>
    </div>
  );
}
