import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: "center" }}>
      <h2>404</h2>
      <p className="muted">Page not found.</p>
      <Link to="/">Back home</Link>
    </div>
  );
}
