import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";

import Profile from "@/pages/Profile";
import Eventselect from "@/pages/Eventselect";
import Organizationmnge from "@/pages/Organizationmnge";
import Forbidden from "@/pages/Forbidden";

// Guards
import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // public
      { index: true, element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "signin", element: <SignIn /> },
      { path: "component", element: <Component /> },
      { path: "forbidden", element: <Forbidden /> },

      // ---------------------------
      // 🔒 Auth-only group
      // ---------------------------
      {
        element: (
          <RequireAuth>
            <Outlet />
          </RequireAuth>
        ),
        children: [
          { path: "profile", element: <Profile /> },
          { path: "eventselect", element: <Eventselect /> },
          { path: "organization", element: <Organizationmnge /> },
        ],
      },

      // ---------------------------
      // 🛡️ Admin group (/admin/*)
      // ---------------------------
      {
        path: "admin",
        element: (
          <RequireRole roles={["ADMIN"]}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          { index: true, element: <div>Admin Dashboard</div> },
          { path: "users", element: <div>Admin Users</div> },
          { path: "settings", element: <div>Admin Settings</div> },
        ],
      },

      // ---------------------------
      // 🛡️ Organizer group (/organize/*)
      // ---------------------------
      {
        path: "organize",
        element: (
          <RequireRole roles={["ORGANIZER"]}>
            <Outlet />
          </RequireRole>
        ),
        children: [
          { path: "events", element: <div>Organizer Events</div> },
          { path: "manage", element: <div>Organizer Manage</div> },
        ],
      },

      // catch-all
      { path: "*", element: <NotFound /> },
    ],
  },
]);
