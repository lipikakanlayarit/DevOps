// src/components/sidebarorg.tsx
"use client";

import { Link, useLocation } from "react-router-dom";
import { BarChart3, FileText, Ticket } from "lucide-react";

interface SidebarProps {
    className?: string;
}

/**
 * ดึง eventId จาก path ปัจจุบัน ถ้ามีรูปแบบ .../eventdetail/:id หรือ .../ticketdetail/:id หรือ .../eventdashboard/:id
 */
function useCurrentEventId() {
    const { pathname } = useLocation();
    const m = pathname.match(/(?:eventdetail|ticketdetail|eventdashboard)\/(\d+)/);
    if (m) return m[1];

    // เผื่อเพิ่งสร้างเสร็จ ให้ใช้ cache ล่าสุด
    try {
        const last = localStorage.getItem("event:last");
        if (last) {
            const j = JSON.parse(last);
            if (j?.id) return String(j.id);
        }
    } catch {}
    return null;
}

export function Sidebar({ className }: SidebarProps) {
    const eventId = useCurrentEventId();

    const menuItems = [
        {
            title: "Event Dashboard",
            href: eventId ? `/eventdashboard/${eventId}` : "/eventdashboard",
            icon: BarChart3,
        },
        {
            title: "Event Details",
            href: eventId ? `/eventdetail/${eventId}` : "/eventdetail",
            icon: FileText,
        },
        {
            title: "Ticket Details",
            href: eventId ? `/ticketdetail/${eventId}` : "/ticketdetail",
            icon: Ticket,
        },
    ];

    const location = useLocation();

    return (
        <div className={`w-64 bg-[#1D1D1D] text-white min-h-screen ${className || ""}`}>
            <nav className="p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => {
                        const IconComponent = item.icon;
                        const active = location.pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    to={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                                        active ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                    }`}
                                >
                                    <IconComponent className="w-5 h-5" />
                                    {item.title}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
}
