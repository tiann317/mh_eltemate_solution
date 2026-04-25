import { Link, useLocation } from "react-router-dom";

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <Link
      to={to}
      style={{
        color: active ? "#1a56db" : "#475569",
        fontSize: 11,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        textDecoration: "none",
        padding: "6px 10px",
        borderBottom: active ? "2px solid #1a56db" : "2px solid transparent",
      }}
    >
      {children}
    </Link>
  );
};

export const Header = () => (
  <header
    className="w-full"
    style={{
      background: "#ffffff",
      borderBottom: "1px solid #e2e8f0",
      padding: "16px 32px",
    }}
  >
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 20,
            height: 20,
            background: "#1a56db",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: 10,
            fontWeight: 700,
          }}
          aria-hidden
        >
          E
        </div>
        <div>
          <div style={{ color: "#0f172a", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
            ELTEMATE
          </div>
          <div style={{ color: "#64748b", fontSize: 10 }}>
            A Hogan Lovells Technology Company
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NavLink to="/">Pre-intake</NavLink>
        <NavLink to="/intake">Full intake</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/staff">Staff</NavLink>
      </div>
      <div style={{ textAlign: "right" }}>
        <h1
          style={{
            color: "#0f172a",
            fontSize: 20,
            fontWeight: 400,
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          Aegis Notice
        </h1>
        <div style={{ color: "#64748b", fontSize: 11 }}>
          EU data breach response — first hour, under control
        </div>
      </div>
    </div>
  </header>
);

export const Footer = () => (
  <footer
    className="w-full mt-auto"
    style={{
      background: "#ffffff",
      borderTop: "1px solid #e2e8f0",
      padding: "16px 32px",
      color: "#64748b",
      fontSize: 11,
    }}
  >
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>© 2026 ELTEMATE — A Hogan Lovells Technology Company</div>
      <div style={{ maxWidth: 540, textAlign: "right" }}>
        Aegis Notice provides structured legal guidance only. It does not constitute legal advice. All notifications must be reviewed by a qualified lawyer or DPO before submission.
      </div>
    </div>
  </footer>
);
