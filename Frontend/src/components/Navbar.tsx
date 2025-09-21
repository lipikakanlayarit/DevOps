// src/components/Navbar.tsx
import { Link, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";

// ── Brand ────────────────────────────────────────────────
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

// ── Types ────────────────────────────────────────────────
type MenuItem =
  | { label: string; to: string; onClick?: undefined }
  | { label: string; to?: undefined; onClick: () => void };

// ── Dropdown / AccountPill ──────────────────────────────
function AccountPill({
  username,
  items,
  menuTextClass = "text-gray-900",
  avatarUrl,
  avatarAlt = `${username}'s avatar`,
}: {
  username: string;
  items: MenuItem[];
  menuTextClass?: string;
  avatarUrl?: string;
  avatarAlt?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // สำหรับ fallback ถ้ารูปโหลดไม่ติด
  const [imgError, setImgError] = useState(false);
  const initials = (username?.trim()?.[0] ?? "?").toUpperCase();

  // ปิดเมื่อคลิกนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !btnRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // คีย์บอร์ด
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      const item = items[activeIndex];
      if ("to" in item && item.to) {
        const el = menuRef.current?.querySelectorAll<HTMLAnchorElement>(
          'a[data-menuitem="true"]'
        )[activeIndex];
        el?.click();
      } else if ("onClick" in item && item.onClick) {
        item.onClick();
      }
      setOpen(false);
    }
  };

  return (
    <div className="relative" onKeyDown={onKeyDown}>
      <button
        ref={btnRef}
        type="button"
        className="flex items-center gap-2 bg-white text-gray-900 rounded-full px-3 h-8 shadow-sm hover:shadow-md transition-shadow"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {/* Avatar / Fallback */}
        {avatarUrl && !imgError ? (
          <img
            src={avatarUrl}
            alt={avatarAlt}
            className="w-6 h-6 rounded-full object-cover bg-gray-200"
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-300 grid place-items-center text-xs font-semibold text-gray-700 select-none">
            {initials}
          </div>
        )}

        <span className="text-sm">@{username}</span>
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl border border-black/5 bg-white shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
        >
          <ul className="py-1">
            {items.map((item, idx) => {
              const base = `block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 outline-none ${menuTextClass}`;
              const active = idx === activeIndex ? "bg-gray-50" : "";
              if ("to" in item && item.to) {
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      data-menuitem="true"
                      className={`${base} ${active}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => setOpen(false)}
                      role="menuitem"
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              }
              return (
                <li key={item.label}>
                  <button
                    className={`${base} ${active}`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    role="menuitem"
                    type="button"
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────
export default function Navbar() {
  const { state, logout } = useAuth();
  const role = state.user?.role ?? "GUEST";
  const isAuthenticated = state.status === "authenticated";

  const getNavbarStyles = () => {
    if (role === "ADMIN" || role === "ORGANIZER") {
      return "bg-zinc-800 backdrop-blur-sm text-white";
    }
    return "bg-[#DBDBDB]/95 backdrop-blur-md border-b border-black/5 text-gray-900";
  };

  const brandSub =
    role === "ADMIN" ? "ADMIN" : role === "ORGANIZER" ? "ORGANIZER" : undefined;

  // เมนูของแต่ละบทบาท
  const userMenu: MenuItem[] = [
    { label: "View Profile", to: "/profile" },
    { label: "Log out", onClick: logout },
  ];

  const organizerMenu: MenuItem[] = [
    { label: "Organization", to: "/organizationmnge" },
    { label: "Log out", onClick: logout },
  ];

  // ✅ Admin sees "Event management" + "Log out"
  const adminMenu: MenuItem[] = [
    { label: "Event management", to: "/admin" },
    { label: "Log out", onClick: logout },
  ];

  const accountMenu =
    role === "ADMIN" ? adminMenu : role === "ORGANIZER" ? organizerMenu : userMenu;

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 ${getNavbarStyles()}`}>
      <div className="w-full">
        <div className="h-[60px] flex items-center justify-between">
          {role === "ADMIN" || role === "ORGANIZER" ? (
            <>
              <div className="pl-4">
                <Link to="/">
                  <Brand sub={brandSub} />
                </Link>
              </div>
              <div className="pr-4">
                <AccountPill
                  username={state.user?.username ?? "guest"}
                  items={accountMenu}
                  menuTextClass="text-[#1d1d1d]"
                  avatarUrl={state.user?.avatarUrl}
                  avatarAlt={state.user?.username ?? "guest"}
                />
              </div>
            </>
          ) : isAuthenticated ? (
            <>
              <div className="flex-1" />
              <div className="flex-1 flex justify-center">
                <Link to="/">
                  <Brand />
                </Link>
              </div>
              <div className="flex-1 flex justify-end pr-4">
                <AccountPill
                  username={state.user?.username ?? "guest"}
                  items={accountMenu}
                  avatarUrl={state.user?.avatarUrl}
                  avatarAlt={state.user?.username ?? "guest"}
                />
              </div>
            </>
          ) : (
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
