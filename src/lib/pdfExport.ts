// Client-side PDF export of an incident, ISO 27035 / ISO 27001 aligned.
// We use the browser print pipeline to keep zero external deps.
// The export builds a self-contained HTML document, opens it in a hidden
// iframe and triggers print-to-PDF. Section ordering follows ISO 27035-2:
//   identification → reporting → assessment → response → lessons learned.

import { FormState, INCIDENT_TYPE_LABELS, SECTOR_LABELS, DPA_MAP } from "@/lib/aegis";

interface ExportPayload {
  incidentId: string;
  isoReference?: string | null;
  severity?: string | null;
  reporterLiteracy?: string | null;
  techEscalationState?: string | null;
  legalEscalationState?: string | null;
  discoveryTime?: string | null;
  formData: FormState;
  riskRating?: string | null;
  status?: string | null;
  aiAssessment?: Record<string, unknown> | null;
  firedAlerts?: { title: string; cite: string }[];
  auditLog: { message: string; created_at: string }[];
  notifications: { framework: string; subject: string; status: string; body?: string }[];
  roles: { role: string; staff_name: string; staff_email?: string | null; assigned_at: string }[];
  preIntake?: {
    reporter_name?: string;
    reporter_title?: string | null;
    reporter_department?: string | null;
    reporter_role?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    literacy?: string;
    story?: string | null;
  } | null;
}

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function section(title: string, body: string) {
  return `
    <section>
      <h2>${esc(title)}</h2>
      ${body}
    </section>`;
}

function kv(rows: [string, unknown][]) {
  return `<table class="kv">${rows.map(([k, v]) =>
    `<tr><th>${esc(k)}</th><td>${esc(v ?? "—")}</td></tr>`).join("")}</table>`;
}

export function exportIncidentToPdf(p: ExportPayload) {
  const isoRef = p.isoReference || `AEGIS-${p.incidentId.slice(0, 8).toUpperCase()}`;
  const generatedAt = new Date().toISOString();

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Incident report ${esc(isoRef)}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, sans-serif; color: #0f172a; font-size: 11pt; line-height: 1.45; }
    h1 { font-size: 20pt; margin: 0 0 4pt; color: #0f172a; }
    h2 { font-size: 13pt; margin: 18pt 0 6pt; color: #1a56db; border-bottom: 1px solid #cbd5e1; padding-bottom: 2pt; }
    h3 { font-size: 11pt; margin: 10pt 0 4pt; color: #0f172a; }
    .meta { color: #475569; font-size: 9pt; margin-bottom: 10pt; }
    .disclaimer { background: #fffbeb; border: 1px solid #b45309; color: #78350f; padding: 8pt 10pt; border-radius: 3pt; margin: 10pt 0; font-size: 9.5pt; }
    table.kv { width: 100%; border-collapse: collapse; margin: 4pt 0 8pt; }
    table.kv th { text-align: left; width: 32%; color: #475569; font-weight: 600; padding: 4pt 6pt; vertical-align: top; border-bottom: 1px solid #e2e8f0; font-size: 10pt; }
    table.kv td { padding: 4pt 6pt; vertical-align: top; border-bottom: 1px solid #e2e8f0; font-size: 10pt; color: #0f172a; }
    table.list { width: 100%; border-collapse: collapse; margin: 4pt 0; }
    table.list th, table.list td { border: 1px solid #cbd5e1; padding: 4pt 6pt; text-align: left; font-size: 9.5pt; }
    table.list th { background: #f1f5f9; color: #0f172a; }
    .badge { display: inline-block; padding: 2pt 6pt; border-radius: 3pt; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
    .b-suspected { background: #fef3c7; color: #78350f; border: 1px solid #b45309; }
    .b-definite { background: #fee2e2; color: #7f1d1d; border: 1px solid #b91c1c; }
    pre.audit { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8pt; font-family: ui-monospace, Menlo, monospace; font-size: 9pt; white-space: pre-wrap; }
    .iso { font-size: 8.5pt; color: #475569; margin-top: 6pt; }
    footer { margin-top: 18pt; border-top: 1px solid #cbd5e1; padding-top: 6pt; color: #475569; font-size: 9pt; }
  </style>
</head>
<body>
  <header>
    <h1>Incident Report</h1>
    <div class="meta">
      Reference <strong>${esc(isoRef)}</strong> · Generated ${esc(generatedAt)}<br/>
      Aegis Notice — ELTEMATE (A Hogan Lovells Technology Company)
    </div>
    <div class="disclaimer">
      <strong>Not legal advice.</strong> This document records a structured
      incident triage produced by Aegis Notice based on user-supplied data and
      publicly available regulatory text. It is best-practice guidance for
      similar incidents and is <em>not</em> a legally binding opinion. Have a
      qualified lawyer or DPO review before relying on any content.
    </div>
    <span class="badge ${p.severity === "definite" ? "b-definite" : "b-suspected"}">
      ${esc(p.severity === "definite" ? "Definite breach" : "Suspected breach")}
    </span>
  </header>

  ${section("1. Identification (ISO/IEC 27035-2 §5)", kv([
    ["Incident reference", isoRef],
    ["Internal ID", p.incidentId],
    ["Discovery time", p.discoveryTime],
    ["Incident type", p.formData.incidentType ? INCIDENT_TYPE_LABELS[p.formData.incidentType] : null],
    ["Sector", p.formData.sector ? SECTOR_LABELS[p.formData.sector] : null],
    ["Jurisdiction / DPA", p.formData.jurisdiction ? DPA_MAP[p.formData.jurisdiction] : null],
    ["Affected count", p.formData.numAffected],
    ["Risk rating", p.riskRating],
    ["Status", p.status],
    ["Severity classification", p.severity],
    ["Reporter literacy", p.reporterLiteracy],
  ]))}

  ${p.preIntake ? section("2. Reporter (pre-intake)", kv([
    ["Name", p.preIntake.reporter_name],
    ["Title", p.preIntake.reporter_title],
    ["Department", p.preIntake.reporter_department],
    ["Role", p.preIntake.reporter_role],
    ["Email", p.preIntake.contact_email],
    ["Phone", p.preIntake.contact_phone],
    ["Literacy classification", p.preIntake.literacy],
  ]) + (p.preIntake.story ? `<h3>Reporter narrative</h3><pre class="audit">${esc(p.preIntake.story)}</pre>` : "")) : ""}

  ${section("3. Assigned roles (audit trail)", p.roles.length ? `
    <table class="list">
      <thead><tr><th>Role</th><th>Name</th><th>Email</th><th>Assigned at</th></tr></thead>
      <tbody>${p.roles.map(r =>
        `<tr><td>${esc(r.role)}</td><td>${esc(r.staff_name)}</td><td>${esc(r.staff_email)}</td><td>${esc(r.assigned_at)}</td></tr>`
      ).join("")}</tbody>
    </table>` : "<p>No roles assigned yet.</p>")}

  ${section("4. Escalation state", kv([
    ["Technical track", p.techEscalationState],
    ["Legal track", p.legalEscalationState],
  ]))}

  ${section("5. Triggered regulatory alerts", (p.firedAlerts && p.firedAlerts.length) ? `
    <table class="list">
      <thead><tr><th>Alert</th><th>Citation</th></tr></thead>
      <tbody>${p.firedAlerts.map(a =>
        `<tr><td>${esc(a.title)}</td><td>${esc(a.cite)}</td></tr>`).join("")}</tbody>
    </table>` : "<p>None.</p>")}

  ${section("6. Notifications", p.notifications.length ? `
    <table class="list">
      <thead><tr><th>Framework</th><th>Subject</th><th>Status</th></tr></thead>
      <tbody>${p.notifications.map(n =>
        `<tr><td>${esc(n.framework)}</td><td>${esc(n.subject)}</td><td>${esc(n.status)}</td></tr>`).join("")}</tbody>
    </table>` : "<p>No notifications drafted.</p>")}

  ${p.aiAssessment ? section("7. Assessment summary", `<pre class="audit">${esc(JSON.stringify(p.aiAssessment, null, 2))}</pre>`) : ""}

  ${section("8. Audit log (chronological)", p.auditLog.length ? `
    <pre class="audit">${p.auditLog.map(l => esc(`${l.created_at} — ${l.message}`)).join("\n")}</pre>
  ` : "<p>No audit entries.</p>")}

  <footer>
    <div class="iso">
      Document classification: Confidential — internal use. Produced in alignment
      with ISO/IEC 27035-2 (incident management) and ISO/IEC 27001 A.5.24–A.5.28
      reporting controls. Retain per organisational records-retention policy.
    </div>
  </footer>
</body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}
