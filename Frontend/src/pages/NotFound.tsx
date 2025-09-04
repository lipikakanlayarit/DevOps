import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="hero">
      <div className="hero-top" />
      <div className="hero-bottom" />

      <div className="login-card" style={{ alignItems: "center" }}>
        <h1 className="login-title">404</h1>
        <p>Page not found.</p>
        <Link to="/login" className="text-sm">🔙 Back to Login</Link>
      </div>
    </div>
  );
}
