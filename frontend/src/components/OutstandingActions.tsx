import { OutstandingAction } from "@/lib/aegis";

const SEV_COLORS: Record<OutstandingAction["severity"], string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#63AFF0",
};

const KIND_LABELS: Record<OutstandingAction["kind"], string> = {
  deadline: "Deadline",
  notification: "Notification",
  decision: "Decision",
};

interface Props {
  actions: OutstandingAction[];
}

const OutstandingActions = ({ actions }: Props) => {
  if (!actions.length) {
    return (
      <div style={{ color: "#52D68A", fontSize: 12, padding: "10px 12px", border: "1px solid rgba(82,214,138,0.3)", background: "rgba(82,214,138,0.06)" }}>
        ✓ No outstanding actions.
      </div>
    );
  }
  const grouped = {
    critical: actions.filter(a => a.severity === "critical"),
    high: actions.filter(a => a.severity === "high"),
    medium: actions.filter(a => a.severity === "medium"),
    low: actions.filter(a => a.severity === "low"),
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {(["critical", "high", "medium", "low"] as const).flatMap(sev => grouped[sev].map((a, i) => (
        <div
          key={`${sev}-${i}`}
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            padding: "8px 12px",
            border: `1px solid ${SEV_COLORS[sev]}`,
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <span style={{
            background: SEV_COLORS[sev], color: "#0a1525",
            fontSize: 9, fontWeight: 700, padding: "2px 6px", letterSpacing: "0.1em",
            textTransform: "uppercase", whiteSpace: "nowrap",
          }}>{sev}</span>
          <span style={{
            background: "rgba(255,255,255,0.08)", color: "#a8bbd4",
            fontSize: 9, fontWeight: 600, padding: "2px 6px", letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>{KIND_LABELS[a.kind]}</span>
          <div style={{ color: "#e2e8f0", fontSize: 12, flex: 1, lineHeight: 1.5 }}>
            {a.framework && <strong style={{ color: "#fff" }}>{a.framework}: </strong>}
            {a.label}
          </div>
        </div>
      )))}
    </div>
  );
};

export default OutstandingActions;
