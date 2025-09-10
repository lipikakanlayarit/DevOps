import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";

function Brand({ sub }: { sub?: string }) {
  return (
    <div className="select-none flex items-baseline">
      <span className="font-extrabold tracking-wide text-3xl">BUTCON</span>
      {sub && (
        <span className="ml-2 text-lg font-bold uppercase text-red-500">
          {sub}
        </span>
      )}
    </div>
  );
}

function AccountPill({ username }: { username: string }) {
  return (
    <button className="flex items-center gap-2 bg-white text-gray-900 rounded-full px-3 h-8 shadow-sm hover:shadow-md transition-shadow">
      <span className="inline-block w-2 h-2 rounded-full bg-gray-400" />
      <span className="text-sm">@{username}</span>
      <span className="text-xs">▾</span>
    </button>
  );
}

export default function Navbar() {
  const { state, logout } = useAuth();
  const role = state.user?.role ?? "GUEST";
  const isAuthenticated = state.status === "authenticated";

  // สีพื้นหลังตามบทบาท
  const getNavbarStyles = () => {
    if (role === "ADMIN" || role === "ORGANIZER") {
      return "bg-zinc-800 text-white"; // Admin/Organizer → พื้นเข้ม
    }
    return "bg-[#DBDBDB] backdrop-blur-sm text-gray-900";
  };

  const brandSub =
    role === "ADMIN"
      ? "ADMIN"
      : role === "ORGANIZER"
      ? "ORGANIZER"
      : undefined;

  return (
    <header className={`sticky top-0 z-40 ${getNavbarStyles()}`}>
      <div className="w-full">
        <div className="h-[60px] flex items-center justify-between">
          {role === "ADMIN" || role === "ORGANIZER" ? (
            // Admin/Organizer: โลโก้ซ้าย padding-left
            <>
              <div className="pl-4">
                <Link to="/">
                  <Brand sub={brandSub} />
                </Link>
              </div>
              <div className="pr-4">
                <AccountPill username={state.user!.username} />
              </div>
            </>
          ) : isAuthenticated ? (
            // User: โลโก้กลาง / โปรไฟล์ขวา
            <>
              <div className="flex-1" />
              <div className="flex-1 flex justify-center">
                <Link to="/">
                  <Brand />
                </Link>
              </div>
              <div className="flex-1 flex justify-end pr-4">
                <AccountPill username={state.user!.username} />
              </div>
            </>
          ) : (
            // Guest: โลโก้กลาง / ลิงก์ขวา
            <>
              <div className="flex-1" />
              <div className="flex-1 flex justify-center">
                <Link to="/">
                  <Brand />
                </Link>
              </div>
              <div className="flex-1 flex justify-end items-center gap-3 pr-4">
                <NavLink
                  to="/login"
                  className="text-sm hover:underline text-gray-700"
                >
                  Log in
                </NavLink>
                <span className="opacity-50 text-gray-500">|</span>
                <NavLink
                  to="/signin"
                  className="text-sm hover:underline text-gray-700"
                >
                  Sign in
                </NavLink>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
