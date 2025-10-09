import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

// ---------- Public pages ----------
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrganizerLogin from "@/pages/OrganizerLogin";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Forbidden from "@/pages/Forbidden";
import Landding from "@/pages/Landding";

// ---------- Protected pages ----------
import Profile from "@/pages/Profile";
import Eventselect from "@/pages/Eventselect";
import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import EventDashboard from "@/pages/Eventdashboard";
import Organizationmnge from "@/pages/Organizationmnge";
import Admin from "@/pages/admin";
import AdminEventdetail from "@/pages/admin-eventdetail";
import EventPermission from "@/pages/admin-permission";

// ---------- Guards ----------
import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ---------- PUBLIC ----------
      { index: true, element: <Landding /> },
      { path: "home", element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "OrganizerLogin", element: <OrganizerLogin /> },
      { path: "signin", element: <SignIn /> },
      { path: "component", element: <Component /> },
      { path: "forbidden", element: <Forbidden /> },
      { path: "eventselect/:id", element: <Eventselect /> },

      // ---------- AUTH-ONLY ----------
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          { path: "profile", element: <Profile /> },
          // อันเดิมยังคงไว้ได้ (ถ้ายังมี flow เก่าใช้อยู่)
          { path: "eventselect", element: <Eventselect /> },
          { path: "eventdetail", element: <Eventdetail /> },
          { path: "ticketdetail", element: <Ticketdetail /> },
          { path: "eventdashboard", element: <EventDashboard /> },
        ],
      },

      // ---------- ORGANIZER + ADMIN ----------
      {
        path: "organizationmnge",
        element: (
          <RequireRole roles={["ORGANIZER", "ADMIN"]}>
            <Organizationmnge />
          </RequireRole>
        ),
      },

      // ---------- ADMIN GROUP ----------
      {
        path: "admin",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          { index: true, element: <Admin /> },
          { path: "users", element: <div>Admin Users Management</div> },
          { path: "settings", element: <div>Admin Settings</div> },
          { path: "eventdetail", element: <AdminEventdetail /> },
          { path: "permissions", element: <EventPermission /> },
        ],
      },

      // ---------- CATCH-ALL ----------
      { path: "*", element: <NotFound /> },
    ],
  },
]);
