// src/pages/admin-usermnge.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar";
import { X, Search } from "lucide-react";
import { api } from "@/lib/api";
import TicketCard from "@/components/TicketCard";

type UserRow = {
    id: string | number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    lastLogin?: string;
    role?: string; // 'USER' | 'ORGANIZER' | 'ADMIN'
};

type TicketItem = {
    poster: string;
    reserveId: string;
    title: string;
    venue: string;
    showDate: string;
    zone: string;
    row: string | number;
    column: string | number;
    total: string | number;
};

/* normalize path/URL ของรูป */
const buildPosterUrl = (v?: string) => {
    if (!v) return "";
    if (/^data:image|^https?:\/\//i.test(v)) return v;
    return v.startsWith("/") ? v : `/${v}`;
};

export default function AdminUserManagement() {
    const [tab, setTab] = useState<"attendee" | "organizer">("attendee");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<UserRow[]>([]);
    const [selected, setSelected] = useState<UserRow | null>(null);
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [tLoading, setTLoading] = useState(false);

    /* ==========================
       Load list (ตามแท็บ)
    ========================== */
    const loadList = async () => {
        setLoading(true);
        try {
            if (tab === "attendee") {
                const res = await api.get("/admin/users");
                const raw: any[] = Array.isArray(res.data)
                    ? res.data
                    : res.data?.users || [];
                const mapped: UserRow[] = raw
                    .filter((u: any) => String(u.role || "").toUpperCase() === "USER")
                    .map((u: any) => ({
                        id: u.id ?? u.userId ?? u.user_id,
                        username: u.username ?? "",
                        firstName: u.firstName ?? u.first_name ?? "",
                        lastName: u.lastName ?? u.last_name ?? "",
                        email: u.email ?? "",
                        phoneNumber: u.phoneNumber ?? u.phone_number ?? "",
                        lastLogin: u.lastLogin ?? u.last_login ?? "-",
                        role: (u.role || "USER").toUpperCase(),
                    }));
                setRows(mapped);
            } else {
                const res = await api.get("/admin/organizers");
                const raw: any[] = Array.isArray(res.data)
                    ? res.data
                    : res.data?.organizers || [];
                const mapped: UserRow[] = raw.map((o: any) => ({
                    id: o.id ?? o.organizerId ?? o.organizer_id,
                    username: o.username ?? "",
                    firstName: o.firstName ?? o.first_name ?? "",
                    lastName: o.lastName ?? o.last_name ?? "",
                    email: o.email ?? "",
                    phoneNumber: o.phoneNumber ?? o.phone_number ?? "",
                    lastLogin: "-", // ไม่มีใน organizer
                    role: "ORGANIZER",
                }));
                setRows(mapped);
            }
        } catch (err) {
            console.error("Load list failed:", err);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab]);

    // debounce ค้นหา client-side
    useEffect(() => {
        const t = setTimeout(() => void loadList(), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const data = useMemo(() => {
        if (!query.trim()) return rows;
        const q = query.toLowerCase();
        return rows.filter((u) =>
            [u.username, u.email, u.firstName, u.lastName]
                .join(" ")
                .toLowerCase()
                .includes(q)
        );
    }, [rows, query]);

    /* ==========================
       Modal open & detail
    ========================== */
    const openDetail = async (u: UserRow) => {
        setSelected(u);
        setTickets([]);
        setTLoading(true);
        try {
            if (tab === "attendee") {
                // แสดงประวัติการซื้อตั๋ว
                const res = await api.get(`/admin/users/${u.id}/tickets`);
                const list: any[] = Array.isArray(res.data)
                    ? res.data
                    : res.data?.tickets || [];

                const mapped: TicketItem[] = list.map((t: any) => {
                    const rawPoster =
                        t.poster ??
                        t.cover ??
                        t.coverImage ??
                        t.cover_image ??
                        t.coverUrl ??
                        t.cover_url ??
                        t.eventCover ??
                        t.event_cover ??
                        "";
                    return {
                        poster: buildPosterUrl(rawPoster),
                        reserveId: t.reserveId ?? t.reserve_id ?? "",
                        title: t.title ?? t.eventTitle ?? "",
                        venue: t.venue ?? t.venueName ?? "",
                        showDate: t.showDate ?? t.show_date ?? "",
                        zone: t.zone ?? t.ticketType ?? "",
                        row: t.row ?? t.seatRow ?? "-",
                        column: t.column ?? t.seatColumn ?? "-",
                        total: t.total ?? t.price ?? "-",
                    };
                });
                setTickets(mapped);
            } else {
                // organizer: ดึงรายละเอียดผู้จัด เพื่อโชว์ข้อมูลในหัวโมดัล (ไม่มีตั๋ว)
                const res = await api.get(`/admin/organizers/${u.id}`);
                const o = res.data || {};
                setSelected((prev) =>
                    prev
                        ? {
                            ...prev,
                            username: o.username ?? prev.username,
                            firstName: o.firstName ?? prev.firstName,
                            lastName: o.lastName ?? prev.lastName,
                            email: o.email ?? prev.email,
                            phoneNumber: o.phoneNumber ?? prev.phoneNumber,
                        }
                        : prev
                );
                setTickets([]); // ไม่มี ticket history สำหรับ organizer
            }
        } catch (err) {
            console.error("Load detail failed:", err);
        } finally {
            setTLoading(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Sidebar />
            <div className="ml-64 flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-100">
                    <div className="flex items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                        <div className="flex items-center gap-3">
                            {/* Tabs */}
                            <div className="inline-flex bg-[#D9D9D9] rounded-full p-1">
                                <button
                                    onClick={() => setTab("attendee")}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                        tab === "attendee"
                                            ? "bg-black text-white"
                                            : "text-gray-700 hover:text-black"
                                    }`}
                                >
                                    Attendee
                                </button>
                                <button
                                    onClick={() => setTab("organizer")}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                        tab === "organizer"
                                            ? "bg-black text-white"
                                            : "text-gray-700 hover:text-black"
                                    }`}
                                >
                                    Organizer
                                </button>
                            </div>

                            {/* Search */}
                            <div className="relative w-[300px] md:w-[360px]">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`Search ${
                                        tab === "attendee" ? "attendees" : "organizers"
                                    }...`}
                                    className="w-full h-11 rounded-full border border-black/10 bg-white pl-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                                />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-0">
                    <div className="bg-white rounded-t-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {tab === "attendee" ? "Attendees" : "Organizers"}:{" "}
                                {loading ? "…" : data.length}
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[980px]">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        USERNAME
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        FIRST_NAME
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        LAST_NAME
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        EMAIL
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        PHONE_NUMBER
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        LAST LOGIN
                                    </th>
                                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        ACTION
                                    </th>
                                </tr>
                                </thead>
                                <tbody>
                                {!loading &&
                                    data.map((u) => (
                                        <tr
                                            key={`${tab}-${u.id}`}
                                            className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="py-3 px-4 text-gray-800">{u.username}</td>
                                            <td className="py-3 px-4 text-gray-800">{u.firstName}</td>
                                            <td className="py-3 px-4 text-gray-800">{u.lastName}</td>
                                            <td className="py-3 px-4 text-gray-800">{u.email}</td>
                                            <td className="py-3 px-4 text-gray-800">
                                                {u.phoneNumber || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-gray-800">
                                                {u.lastLogin || "-"}
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => void openDetail(u)}
                                                    className="px-4 py-1.5 rounded-full border-2 border-red-500 text-red-500 font-medium hover:bg-red-50 transition-colors"
                                                >
                                                    View detail
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                {loading && (
                                    <tr>
                                        <td className="py-10 text-center text-gray-500" colSpan={7}>
                                            Loading…
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-b-lg shadow-sm border-t border-gray-200 px-4 py-3 text-sm text-gray-700">
                        Page 1 of 1
                    </div>
                </div>
            </div>

            {selected && (
                <UserDetailModal
                    user={selected}
                    tickets={tickets}
                    loading={tLoading}
                    isOrganizer={tab === "organizer"}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

/* ---------- Modal ---------- */
function UserDetailModal({
                             user,
                             tickets,
                             loading,
                             isOrganizer,
                             onClose,
                         }: {
    user: UserRow;
    tickets: TicketItem[];
    loading: boolean;
    isOrganizer: boolean;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[999]"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-[780px] rounded-[30px] shadow-xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-5 border-b flex items-start justify-between">
                    <div>
                        <div className="text-2xl font-bold">{user.username}</div>
                        <div className="text-gray-500 text-sm">{user.email}</div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Info */}
                <div className="p-5 border-b text-sm grid grid-cols-2 gap-y-3 gap-x-4">
                    <div>
                        <div className="text-gray-500 text-xs">Name</div>
                        <div className="font-medium">
                            {user.firstName} {user.lastName}
                        </div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">Phone Number</div>
                        <div className="font-medium">{user.phoneNumber || "-"}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">Last Login</div>
                        <div className="font-medium">{user.lastLogin || "-"}</div>
                    </div>
                    <div>
                        <div className="text-gray-500 text-xs">Email</div>
                        <div className="font-medium">{user.email}</div>
                    </div>
                </div>

                {/* Ticket History (show only for attendee) */}
                <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-semibold text-lg">
                            {isOrganizer ? "Organizer Detail" : `Ticket History (${tickets.length})`}
                        </h3>
                        {!isOrganizer && (
                            <div className="relative w-[150px]">
                                <input
                                    placeholder="Search..."
                                    className="w-full h-8 rounded-full border border-gray-300 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                                />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {loading && <div className="text-center text-gray-500 py-6">Loading…</div>}

                    {!isOrganizer && !loading && tickets.map((t) => (
                        <TicketCard key={t.reserveId} {...t} />
                    ))}

                    {isOrganizer && !loading && (
                        <div className="text-sm text-gray-700">
                            This organizer does not have ticket history.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
