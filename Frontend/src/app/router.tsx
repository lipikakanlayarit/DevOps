// src/router.tsx
import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

// ---------- Public Pages ----------
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrganizerLogin from "@/pages/OrganizerLogin";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Forbidden from "@/pages/Forbidden";
import Landding from "@/pages/Landding";

// ---------- Protected Pages ----------
import Profile from "@/pages/Profile";
import Eventselect from "@/pages/Eventselect";
import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import EventDashboard from "@/pages/Eventdashboard";
import Organizationmnge from "@/pages/Organizationmnge";

// ---------- Payment Page (NEW) ----------
import Payment from "@/pages/payment"; // <<-- เพิ่ม import

// ---------- Admin Pages ----------
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
            /* ===========================
               Public Pages
               =========================== */
            { index: true, element: <Landding /> },
            { path: "home", element: <Home /> },
            { path: "login", element: <Login /> },
            { path: "organizerlogin", element: <OrganizerLogin /> },
            { path: "signin", element: <SignIn /> },
            { path: "component", element: <Component /> },
            { path: "forbidden", element: <Forbidden /> },

            /* ===========================
               Auth Required
               =========================== */
            {
                element: (
                    <RequireAuth>
                        <Outlet />
                    </RequireAuth>
                ),
                children: [
                    { path: "profile", element: <Profile /> },

                    // ✅ Event select (ซื้อบัตร/เลือกที่นั่ง)
                    { path: "eventselect", element: <Eventselect /> },
                    { path: "eventselect/:eventId", element: <Eventselect /> },

                    // ✅ Create Event
                    { path: "eventdetail", element: <Eventdetail /> },

                    // ✅ Edit Event
                    { path: "eventdetail/:eventId", element: <Eventdetail /> },

                    // ✅ Ticket Detail (สำหรับ setup ticket)
                    { path: "ticketdetail", element: <Ticketdetail /> },
                    { path: "ticketdetail/:eventId", element: <Ticketdetail /> },

                    // ✅ Dashboard per event
                    { path: "eventdashboard", element: <EventDashboard /> },
                    { path: "eventdashboard/:eventId", element: <EventDashboard /> },

                    // ✅ Payment (NEW)
                    { path: "payment/:reservedId", element: <Payment /> }, // <<-- เพิ่มเส้นทาง
                ],
            },

            /* ===========================
               Organizer / Admin
               =========================== */
            {
                path: "organizationmnge",
                element: (
                    <RequireRole roles={["ORGANIZER", "ADMIN"]}>
                        <Organizationmnge />
                    </RequireRole>
                ),
            },

            /* ===========================
               Admin Section
               =========================== */
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

            /* ===========================
               Fallback (404)
               =========================== */
            { path: "*", element: <NotFound /> },
        ],
    },
]);
