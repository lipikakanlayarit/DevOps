// src/router.tsx
import { createBrowserRouter, Outlet } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";

// ---------- Public Pages ----------
import Landing from "@/pages/Landding";            // ✅ ชื่อให้ตรงไฟล์ Landing.tsx
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import OrganizerLogin from "@/pages/OrganizerLogin";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Forbidden from "@/pages/Forbidden";
import CheckinConfirmPage from "@/pages/checkin"; // ✅ Public QR check-in confirm

// ---------- Event/Ticket (ทำให้เป็น Public) ----------
import Eventselect from "@/pages/Eventselect";
import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import Payment from "@/pages/payment";            // ✅ ให้ guest ไปต่อได้

// ---------- Protected Pages ----------
import Profile from "@/pages/Profile";
import EventDashboard from "@/pages/Eventdashboard";
import Organizationmnge from "@/pages/Organizationmnge";

// ---------- Admin Pages ----------
import Admin from "@/pages/admin";
import AdminEventdetail from "@/pages/admin-eventdetail";
import EventPermission from "@/pages/admin-permission";
import AdminUserMnge from "@/pages/admin-usermange.tsx";

// ---------- Guards ----------
import RequireAuth from "@/features/auth/RequireAuth";
import RequireRole from "@/features/auth/RequireRole";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        children: [
            // ===== PUBLIC =====
            { index: true, element: <Landing /> },      // ✅ หน้าแรกใช้ Landing
            { path: "home", element: <Home /> },
            { path: "login", element: <Login /> },
            { path: "organizerlogin", element: <OrganizerLogin /> },
            { path: "signin", element: <SignIn /> },
            { path: "component", element: <Component /> },
            { path: "forbidden", element: <Forbidden /> },

            // ✅ Public check-in confirm (จาก QR)
            { path: "checkin/:reservedId", element: <CheckinConfirmPage /> },

            // ✅ PUBLIC Event/Ticket/Payment (ไม่บังคับล็อกอิน)
            { path: "eventselect", element: <Eventselect /> },
            { path: "eventselect/:eventId", element: <Eventselect /> },
            { path: "eventdetail", element: <Eventdetail /> },
            { path: "eventdetail/:eventId", element: <Eventdetail /> },
            { path: "ticketdetail", element: <Ticketdetail /> },
            { path: "ticketdetail/:eventId", element: <Ticketdetail /> },
            { path: "payment/:reservedId", element: <Payment /> }, // ✅ guest ไปจ่ายได้

            // ===== AUTH REQUIRED (ผู้ใช้ทั่วไป) =====
            {
                element: (
                    <RequireAuth>
                        <Outlet />
                    </RequireAuth>
                ),
                children: [
                    { path: "profile", element: <Profile /> },
                    // หมายเหตุ: EventDashboard เป็นหน้าภายในหลังล็อกอินอยู่แล้ว
                    { path: "eventdashboard", element: <EventDashboard /> },
                    { path: "eventdashboard/:eventId", element: <EventDashboard /> },
                ],
            },

            // ===== ORGANIZER / ADMIN =====
            {
                path: "organizationmnge",
                element: (
                    <RequireRole roles={["ORGANIZER", "ADMIN"]}>
                        <Organizationmnge />
                    </RequireRole>
                ),
            },

            // ===== ADMIN SECTION =====
            {
                path: "admin",
                element: (
                    <RequireRole roles={["ADMIN"]}>
                        <Outlet />
                    </RequireRole>
                ),
                children: [
                    { index: true, element: <Admin /> },
                    { path: "usermnge", element: <AdminUserMnge /> },
                    { path: "users", element: <div>Admin Users Management</div> },
                    { path: "settings", element: <div>Admin Settings</div> },
                    { path: "eventdetail", element: <AdminEventdetail /> },
                    { path: "permissions", element: <EventPermission /> },
                ],
            },

            // 404
            { path: "*", element: <NotFound /> },
        ],
    },
]);
