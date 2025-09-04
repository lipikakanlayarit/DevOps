import { useState, type FormEvent } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");

  const onLogin = (e: FormEvent) => {
    e.preventDefault();
    // TODO: เรียก backend ที่นี่
    alert(`Log in with\nEmail: ${email}\nPassword: ${"*".repeat(pwd.length)}`);
  };

  return (
    <div className="hero">
      <div className="hero-top" />
      <div className="hero-bottom" />

      <form className="login-card" onSubmit={onLogin}>
        <h1 className="login-title">LOGIN</h1>

        <div className="form-group">
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="Value"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="form-group">
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            placeholder="Value"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="actions">
          <button className="btn-primary" type="submit">Log in</button>
          <button className="btn-secondary" type="button">Sign in</button>
        </div>

        <div className="forgot">
          <a href="#" className="text-sm">Forgot password?</a>
        </div>
      </form>
    </div>
  );
}
