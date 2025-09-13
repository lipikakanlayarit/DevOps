import { createBrowserRouter } from "react-router-dom";
import RootLayout from "@/layouts/RootLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignIn from "@/pages/SignIn";
import NotFound from "@/pages/NotFound";
import Component from "@/pages/Component";
import Eventselect from "@/pages/Eventselect";
import Organizationmnge  from "@/pages/Organizationmnge";
import Eventdetail from "@/pages/Eventdetail";
import Ticketdetail from "@/pages/Ticketdetail";
import Eventdashbaord from "@/pages/Eventdashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Home /> },

      { path: "login", element: <Login /> },
      { path: "signin", element: <SignIn /> },

      // ตัวอย่าง route อื่นๆ
      { path: "dashboard", element: <div>Admin Dashboard</div> },
      { path: "users", element: <div>Admin Users</div> },
      { path: "settings", element: <div>Admin Settings</div> },
      { path: "organize/events", element: <div>Organizer Events</div> },
      { path: "organize/manage", element: <div>Organizer Manage</div> },
      

      // ✅ ใช้ Component หน้านี้ และใช้ path เป็นตัวพิมพ์เล็ก
      { path: "component", element: <Component /> },
      { path: "eventselect", element: <Eventselect /> },
      { path: "organization", element: <Organizationmnge /> },
      { path: "eventdetail", element: <Eventdetail /> },
      { path: "ticketdetail", element: <Ticketdetail /> },
      { path: "eventdashboard", element: <Eventdashbaord /> },
      // เส้นทางสำคัญ: หน้าจัดการ 404

      // ✅ catch-all ต้องเป็น "*"
      { path: "*", element: <NotFound /> },
    ],
  },
]);
