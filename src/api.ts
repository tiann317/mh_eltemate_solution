import type { Assessment, AuditLog, Incident, Notification } from "./types";

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  assess: (userMessage: string) =>
    http<Assessment>("/ai/assess-breach", {
      method: "POST",
      body: JSON.stringify({ userMessage }),
    }),

  listIncidents: () => http<Incident[]>("/incidents"),
  getIncident: (id: string) => http<Incident>(`/incidents/${id}`),
  createIncident: (body: Partial<Incident>) =>
    http<Incident>("/incidents", { method: "POST", body: JSON.stringify(body) }),
  deleteIncident: (id: string) =>
    http<void>(`/incidents/${id}`, { method: "DELETE" }),

  listNotifications: (incidentId: string) =>
    http<Notification[]>(`/notifications?incident_id=${incidentId}`),

  listLogs: (incidentId: string) =>
    http<AuditLog[]>(`/audit-logs?incident_id=${incidentId}`),
  createLog: (incidentId: string, message: string) =>
    http<AuditLog>("/audit-logs", {
      method: "POST",
      body: JSON.stringify({ incident_id: incidentId, message }),
    }),
};
