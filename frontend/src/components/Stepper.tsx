interface StepperProps {
  current: number; // 1..6
}

const STEPS = ["Discovery", "Data & People", "Organisation", "Legal context", "Review", "Assessment"];

export const Stepper = ({ current }: StepperProps) => (
  <div style={{ padding: "24px 32px" }} className="w-full">
    <div className="relative flex items-center justify-between max-w-3xl mx-auto">
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 14,
          right: 14,
          height: 1,
          background: "rgba(255,255,255,0.1)",
          zIndex: 0,
        }}
      />
      {STEPS.map((label, i) => {
        const n = i + 1;
        const completed = n < current;
        const active = n === current;
        return (
          <div key={label} className="flex flex-col items-center" style={{ zIndex: 1, flex: 1 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: completed || active ? "#1a56db" : "rgba(255,255,255,0.12)",
                color: completed || active ? "#fff" : "#a8bbd4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 500,
              }}
              aria-current={active ? "step" : undefined}
            >
              {completed ? "✓" : n}
            </div>
            <div style={{ fontSize: 11, color: "#a8bbd4", marginTop: 8, textAlign: "center" }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);
