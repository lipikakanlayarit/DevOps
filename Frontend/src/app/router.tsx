// src/app/router.tsx
import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

// public pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrganizerLogin from "@/pages/OrganizerLogin";
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
import EventDashboard from "@/pages/Eventdashboard";
import Organizationmnge from "@/pages/Organizationmnge";
import Admin from "@/pages/admin";
import AdminEventdetail from "@/pages/admin-eventdetail";
import EventPermission from "@/pages/admin-permission";

// guards
import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            // public
            { index: true, element: <Landding /> },
            { path: "home", element: <Home /> },
            { path: "login", element: <Login /> },
            { path: "OrganizerLogin", element: <OrganizerLogin /> },
            { path: "signin", element: <SignIn /> },
            { path: "component", element: <Component /> },
            { path: "forbidden", element: <Forbidden /> },

            // auth-only
            {
                element: (
                    <RequireAuth>
                        <Outlet />
                    </RequireAuth>
                ),
                children: [
                    { path: "profile", element: <Profile /> },
                    { path: "eventselect", element: <Eventselect /> },
                    { path: "eventdetail", element: <Eventdetail /> },
                    { path: "ticketdetail", element: <Ticketdetail /> },
                    { path: "eventdashboard", element: <EventDashboard /> },
                ],
            },

            // organizer/admin only
            {
                path: "organizationmnge",
                element: (
                    <RequireRole roles={["ORGANIZER", "ADMIN"]}>
                        <Organizationmnge />
                    </RequireRole>
                ),
            },

            // admin group
            {
                path: "admin",
                element: (
                    <RequireRole roles={["ADMIN"]}>
                        <Outlet />
                    </RequireRole>
                ),
                children: [
                    { index: true, element: <Admin /> },
                    { path: "users", element: <div>Admin Users</div> },
                    { path: "settings", element: <div>Admin Settings</div> },
                    { path: "eventdetail", element: <AdminEventdetail /> },
                    { path: "permissions", element: <EventPermission /> },
                ],
            },

            // organizer group
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
