import { Link, Outlet } from "react-router-dom";
import "../index.css";

export default function RootLayout() {
  return (
    <>
      <div className="navbar">
        <div />
        <div className="brand">BUTCON</div>
        <div className="nav-right">
          <Link to="/login" className="text-sm">Log in</Link>
          <span className="nav-divider">|</span>
          <Link to="/signin" className="text-sm">Sign in</Link>
        </div>
      </div>
      <Outlet />
    </>
  );
}
