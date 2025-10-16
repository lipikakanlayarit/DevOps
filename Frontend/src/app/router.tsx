import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

// Public pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrganizerLogin from "@/pages/OrganizerLogin";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Forbidden from "@/pages/Forbidden";
import Landding from "@/pages/Landding";

// Protected pages
import Profile from "@/pages/Profile";
import Eventselect from "@/pages/Eventselect";
import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import EventDashboard from "@/pages/Eventdashboard";
import Organizationmnge from "@/pages/Organizationmnge";

// Admin pages
import Admin from "@/pages/admin";
import AdminEventdetail from "@/pages/admin-eventdetail";
import EventPermission from "@/pages/admin-permission";

// Guards
import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            // ---------- Public ----------
            { index: true, element: <Landding /> },
            { path: "home", element: <Home /> },
            { path: "login", element: <Login /> },
            { path: "OrganizerLogin", element: <OrganizerLogin /> },
            { path: "signin", element: <SignIn /> },
            { path: "component", element: <Component /> },
            { path: "forbidden", element: <Forbidden /> },

            // ---------- Auth required ----------
            {
                element: (
                    <RequireAuth>
                        <Outlet />
                    </RequireAuth>
                ),
                children: [
                    { path: "profile", element: <Profile /> },
                    { path: "eventselect", element: <Eventselect /> },

                    // Create Event
                    { path: "eventdetail", element: <Eventdetail /> },

                    // ✅ Edit Event (prefill from id)
                    { path: "eventdetail/:eventId", element: <Eventdetail /> },

                    // ✅ Ticket Details (prefill & update)
                    { path: "ticketdetail/:eventId", element: <Ticketdetail /> },

                    // Fallback (เดิม ถ้าเข้าโดยยังไม่มี id)
                    { path: "ticketdetail", element: <Ticketdetail /> },

                    // Event dashboard (ถ้าใช้งาน)
                    { path: "eventdashboard/:eventId", element: <EventDashboard /> },
                    { path: "eventdashboard", element: <EventDashboard /> },
                ],
            },

            // ---------- Organizer/ Admin ----------
            {
                path: "organizationmnge",
                element: (
                    <RequireRole roles={["ORGANIZER", "ADMIN"]}>
                        <Organizationmnge />
                    </RequireRole>
                ),
            },

            // ---------- Admin ----------
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

            // ---------- 404 ----------
            { path: "*", element: <NotFound /> },
        ],
    },
]);
