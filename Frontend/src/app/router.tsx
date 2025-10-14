import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrganizerLogin from "@/pages/OrganizerLogin";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Forbidden from "@/pages/Forbidden";
import Landding from "@/pages/Landding";

import Profile from "@/pages/Profile";
import Eventselect from "@/pages/Eventselect";
import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import EventDashboard from "@/pages/Eventdashboard";
import Organizationmnge from "@/pages/Organizationmnge";
import Admin from "@/pages/admin";
import AdminEventdetail from "@/pages/admin-eventdetail";
import EventPermission from "@/pages/admin-permission";

import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            { index: true, element: <Landding /> },
            { path: "home", element: <Home /> },
            { path: "login", element: <Login /> },
            { path: "OrganizerLogin", element: <OrganizerLogin /> },
            { path: "signin", element: <SignIn /> },
            { path: "component", element: <Component /> },
            { path: "forbidden", element: <Forbidden /> },

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

                    // ✅ รองรับพารามิเตอร์ eventId
                    { path: "eventdashboard/:eventId", element: <EventDashboard /> },
                    // (ถ้าอยากคง path เดิมไว้ด้วยก็ได้)
                    { path: "eventdashboard", element: <EventDashboard /> },
                ],
            },

            {
                path: "organizationmnge",
                element: (
                    <RequireRole roles={["ORGANIZER", "ADMIN"]}>
                        <Organizationmnge />
                    </RequireRole>
                ),
            },

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

            { path: "*", element: <NotFound /> },
        ],
    },
]);
