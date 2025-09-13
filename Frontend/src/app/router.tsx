import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

// public pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Forbidden from "@/pages/Forbidden";
import Landding from "@/pages/Landding";

// protected pages
import Profile from "@/pages/Profile";
import Eventselect from "@/pages/Eventselect";


import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import Eventdashbaord from "@/pages/Eventdashboard";

import Organizationmnge from "@/pages/Organizationmnge";

// guards
import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // ---------- public ----------
      { index: true, element: <Landding /> },   // หน้าแรกเป็น Landding
      { path: "home", element: <Home /> },      // เผื่ออยากเข้าหน้า Home โดยตรง
      { path: "login", element: <Login /> },
      { path: "signin", element: <SignIn /> },
      { path: "component", element: <Component /> },
      { path: "forbidden", element: <Forbidden /> },

      // ---------- auth-only ----------
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


      // ✅ ใช้ Component หน้านี้ และใช้ path เป็นตัวพิมพ์เล็ก
      { path: "component", element: <Component /> },
      { path: "eventselect", element: <Eventselect /> },
      { path: "organization", element: <Organizationmnge /> },
      { path: "eventdetail", element: <Eventdetail /> },
      { path: "ticketdetail", element: <Ticketdetail /> },
      { path: "eventdashboard", element: <Eventdashbaord /> },
      // เส้นทางสำคัญ: หน้าจัดการ 404

      // ---------- admin group (/admin/*) ----------
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

      // ---------- organizer group (/organize/*) ----------
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


      // ---------- catch-all ----------
      { path: "*", element: <NotFound /> },
    ],
  },
]);
