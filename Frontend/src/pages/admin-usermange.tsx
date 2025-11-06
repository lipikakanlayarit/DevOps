// src/pages/admin-usermnge.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/sidebar";
import { X, Search } from "lucide-react";
import { api } from "@/lib/api";
import TicketCard from "@/components/TicketCard";
import posterFallback from "@/assets/poster.png";

/* ------------ Types ------------ */
type UserRow = {
    id: string | number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    lastLogin?: string;
    address?: string; // ✅ สำหรับ organizer
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
    _eventId?: string | number;
    _coverUpdatedAt?: string;
};

type OrganizerEventItem = {
    eventId?: string | number;
    poster: string;
    title: string;
    venue: string;
    showDate: string;
    zone?: string;
    row?: number | string;
    column?: number | string;
    price?: number | string;
    _coverUpdatedAt?: string;
};

/* ------------ Helpers ------------ */
// ✅ ใช้ public endpoint เสมอ
const coverPath = (id?: string | number, updatedAt?: string) =>
    id != null
        ? `/api/public/events/${id}/cover${updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : ""}`
        : "";

const buildPosterUrl = (v?: string) => {
    if (!v) return "";
    if (/^data:image|^https?:\/\//i.test(v)) return v;
    return v.startsWith("/") ? v : `/${v}`;
};

/* ------------ Page ------------ */
export default function AdminUserManagement() {
    const [tab, setTab] = useState<"attendee" | "organizer">("attendee");
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<UserRow[]>([]);
    const [selected, setSelected] = useState<UserRow | null>(null);
    const [tickets, setTickets] = useState<TicketItem[]>([]);
    const [tLoading, setTLoading] = useState(false);

    const loadList = async () => {
        setLoading(true);
        try {
            if (tab === "attendee") {
                const res = await api.get("/admin/users");
                const raw: any[] = Array.isArray(res.data) ? res.data : res.data?.users || [];
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
                const raw: any[] = Array.isArray(res.data) ? res.data : res.data?.organizers || [];
                const mapped: UserRow[] = raw.map((o: any) => ({
                    id: o.id ?? o.organizerId ?? o.organizer_id,
                    username: o.username ?? "",
                    firstName: o.firstName ?? o.first_name ?? "",
                    lastName: o.lastName ?? o.last_name ?? "",
                    email: o.email ?? "",
                    phoneNumber: o.phoneNumber ?? o.phone_number ?? "",
                    address: o.address ?? o.addr ?? "-",
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

    useEffect(() => {
        const t = setTimeout(() => void loadList(), 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    const data = useMemo(() => {
        if (!query.trim()) return rows;
        const q = query.toLowerCase();
        return rows.filter((u) =>
            [u.username, u.email, u.firstName, u.lastName].join(" ").toLowerCase().includes(q)
        );
    }, [rows, query]);

    const openDetail = async (u: UserRow) => {
        setSelected(u);
        setTickets([]);
        setTLoading(true);
        try {
            if (tab === "attendee") {
                const res = await api.get(`/admin/users/${u.id}/tickets`);
                const list: any[] = Array.isArray(res.data) ? res.data : res.data?.tickets || [];
                const mapped: TicketItem[] = list.map((t: any) => {
                    const eventId = t.eventId ?? t.event_id ?? t.eventsNamId ?? t.events_id;
                    const updatedAt =
                        t.updatedAt ?? t.updated_at ?? t.cover_updated_at ?? t.modifiedAt ?? t.coverUpdatedAt;
                    // ✅ ใช้ poster จาก backend ก่อน ถ้าไม่มีค่อยคำนวณเอง
                    const fromBackend = t.poster || t.cover || t.coverUrl || t.eventCover || "";
                    const rawPoster = fromBackend || (eventId ? coverPath(eventId, updatedAt) : "");
                    return {
                        poster: buildPosterUrl(rawPoster),
                        reserveId: t.reserveId ?? t.reserve_id ?? "",
                        title: t.title ?? t.eventTitle ?? t.name ?? "",
                        venue: t.venue ?? t.venueName ?? t.location ?? "",
                        showDate: t.showDate ?? t.show_date ?? t.startDateTime ?? t.startDatetime ?? "",
                        zone: t.zone ?? t.ticketType ?? "",
                        row: t.row ?? t.seatRow ?? "-",
                        column: t.column ?? t.seatColumn ?? "-",
                        total: t.total ?? t.price ?? "-",
                        _eventId: eventId,
                        _coverUpdatedAt: updatedAt,
                    };
                });
                setTickets(mapped);
            } else {
                // โหลดข้อมูลโปรไฟล์ organizer
                const res = await api.get(`/admin/organizers/${u.id}`);
                const o = res.data || {};
                setSelected((prev) =>
                    prev
                        ? {
                            ...prev,
                            username: o.username ?? prev.username,
                            firstName: o.firstName ?? o.first_name ?? prev.firstName,
                            lastName: o.lastName ?? o.last_name ?? prev.lastName,
                            email: o.email ?? prev.email,
                            phoneNumber: o.phoneNumber ?? o.phone_number ?? prev.phoneNumber,
                            address: o.address ?? o.addr ?? prev.address,
                        }
                        : prev
                );
            }
        } catch (err) {
            console.error("Open detail failed:", err);
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
                            <div className="inline-flex bg-[#D9D9D9] rounded-full p-1">
                                <button
                                    onClick={() => setTab("attendee")}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                        tab === "attendee" ? "bg-black text-white" : "text-gray-700 hover:text-black"
                                    }`}
                                >
                                    Attendee
                                </button>
                                <button
                                    onClick={() => setTab("organizer")}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                        tab === "organizer" ? "bg-black text-white" : "text-gray-700 hover:text-black"
                                    }`}
                                >
                                    Organizer
                                </button>
                            </div>

                            {/* Search list users */}
                            <div className="relative w-[300px] md:w-[360px]">
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={`Search ${tab === "attendee" ? "attendees" : "organizers"}...`}
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
                                {tab === "attendee" ? "Attendees" : "Organizers"}: {loading ? "…" : data.length}
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
                                        {tab === "organizer" ? "ADDRESS" : "LAST LOGIN"}
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
                                            <td className="py-3 px-4 text-gray-800">{u.phoneNumber || "-"}</td>
                                            <td className="py-3 px-4 text-gray-800">
                                                {tab === "organizer" ? u.address || "-" : u.lastLogin || "-"}
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
                    isOrganizer={tab === "organizer" || selected.role === "ORGANIZER"}
                    onClose={() => setSelected(null)}
                />
            )}
        </div>
    );
}

/* ------------ Modal ------------ */
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
    // attendee search
    const [q, setQ] = useState("");

    // organizer event history
    const [orgSearch, setOrgSearch] = useState("");
    const [orgEvents, setOrgEvents] = useState<OrganizerEventItem[]>([]);
    const [orgLoading, setOrgLoading] = useState(false);

    // โหลด Event History ของ organizer
    useEffect(() => {
        if (!isOrganizer || !user?.id) return;
        (async () => {
            try {
                setOrgLoading(true);
                const res = await api.get(`/admin/organizers/${user.id}/events`);
                const list: any[] = Array.isArray(res.data) ? res.data : res.data?.events || [];
                const mapped: OrganizerEventItem[] = list.map((e: any) => {
                    const eventId = e.id ?? e.eventId ?? e.eventsNamId ?? e.events_id;
                    const updatedAt =
                        e.updatedAt ?? e.updated_at ?? e.cover_updated_at ?? e.coverVer ?? e.modifiedAt ?? e.coverUpdatedAt;

                    // ✅ ใช้ poster จาก backend ก่อน ถ้าไม่มีค่อยคำนวณเอง
                    const fromBackend = e.poster || e.cover || e.coverUrl || "";
                    const rawPoster = fromBackend || (eventId ? coverPath(eventId, updatedAt) : "");

                    return {
                        eventId,
                        poster: buildPosterUrl(rawPoster),
                        title: e.title ?? e.eventName ?? e.name ?? "-",
                        venue: e.venue ?? e.venueName ?? e.location ?? "-",
                        showDate: e.showDate ?? e.show_date ?? e.startDateTime ?? e.startDatetime ?? "-",
                        zone: e.zone ?? e.ticketType ?? "VIP",
                        row: e.row ?? e.seatRow ?? 1,
                        column: e.column ?? e.seatColumn ?? 1,
                        price: e.total ?? e.price ?? 0,
                        _coverUpdatedAt: updatedAt,
                    };
                });
                setOrgEvents(mapped);
            } catch (err) {
                console.error("Load organizer events failed:", err);
                setOrgEvents([]);
            } finally {
                setOrgLoading(false);
            }
        })();
    }, [isOrganizer, user?.id]);

    // attendee: dedup + token search
    const deduped = useMemo(() => {
        const m = new Map<string, TicketItem>();
        for (const t of tickets) {
            const key = [t.reserveId, t.zone, t.row, t.column, t.total].join("|");
            if (!m.has(key)) m.set(key, t);
        }
        return Array.from(m.values());
    }, [tickets]);

    const filtered = useMemo(() => {
        const tokens = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (tokens.length === 0) return deduped;
        return deduped.filter((t) => {
            const hay = [
                t.reserveId,
                t.title,
                t.venue,
                t.showDate,
                t.zone,
                String(t.row),
                String(t.column),
                String(t.total),
            ]
                .join(" ")
                .toLowerCase();
            return tokens.every((tk) => hay.includes(tk));
        });
    }, [deduped, q]);

    const orgFiltered = useMemo(() => {
        const q = orgSearch.toLowerCase().trim();
        if (!q) return orgEvents;
        return orgEvents.filter((e) =>
            [e.title, e.venue, e.showDate, String(e.price)].join(" ").toLowerCase().includes(q)
        );
    }, [orgEvents, orgSearch]);

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-[999]"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-[1040px] max-h-[90vh] rounded-[30px] shadow-xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-5 border-b flex items-start justify-between">
                    <div className="min-w-0">
                        <div className="text-2xl font-bold truncate">{user.username}</div>
                        <div className="text-gray-500 text-sm truncate">{user.email}</div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition">
                        <X className="w-5 h-5 text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                {isOrganizer ? (
                    /* ===== ORGANIZER: ซ้าย–ขวา ===== */
                    <div className="flex-1 flex min-h-0">
                        {/* Left profile */}
                        <div className="flex-1 p-6 border-r overflow-y-auto">
                            <div className="text-sm grid grid-cols-2 gap-y-4 gap-x-6">
                                <div>
                                    <div className="text-gray-500 text-xs">Name</div>
                                    <div className="font-medium break-words">
                                        {user.firstName} {user.lastName}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs">Phone Number</div>
                                    <div className="font-medium break-words">{user.phoneNumber || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs">Address</div>
                                    <div className="font-medium break-words">{user.address || "-"}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500 text-xs">Email</div>
                                    <div className="font-medium break-words">{user.email}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right history */}
                        <div className="w-[460px] bg-[#121212] text-white flex flex-col min-h-0">
                            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                                <h3 className="font-semibold text-lg">Event History ({orgEvents.length})</h3>
                                <div className="relative w-[220px]">
                                    <input
                                        value={orgSearch}
                                        onChange={(e) => setOrgSearch(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full h-9 rounded-full border border-white/20 bg-white/10 text-white pl-4 pr-9 text-sm placeholder:text-white/60 outline-none focus:ring-2 focus:ring-white/20"
                                    />
                                    <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {orgLoading && (
                                    <>
                                        <MiniTicketSkeleton />
                                        <MiniTicketSkeleton />
                                    </>
                                )}
                                {!orgLoading && orgFiltered.length === 0 && (
                                    <div className="text-center text-white/70 py-6">No events.</div>
                                )}
                                {!orgLoading &&
                                    orgFiltered.map((e) => <MiniTicket key={`${e.eventId}-${e.showDate}`} item={e} />)}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ===== ATTENDEE ===== */
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="p-5 flex items-center justify-between border-b">
                            <h3 className="font-semibold text-lg">Ticket History ({tickets.length})</h3>
                            <div className="relative w-[180px]">
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full h-8 rounded-full border border-gray-300 pl-3 pr-8 text-sm outline-none focus:ring-2 focus:ring-gray-300"
                                />
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {loading && <div className="text-center text-gray-500 py-6">Loading…</div>}
                            {!loading && filtered.length === 0 && (
                                <div className="text-center text-gray-500 py-6">No tickets found.</div>
                            )}
                            {!loading &&
                                filtered.map((t) => (
                                    <TicketCard
                                        key={[t.reserveId, t.zone, t.row, t.column, t.total].join("|")}
                                        {...t}
                                    />
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ------------ MiniTicket (Organizer side) ------------ */
function MiniTicket({ item }: { item: OrganizerEventItem }) {
    const src =
        item.poster && String(item.poster).trim().length > 0
            ? (item.poster as string)
            : ((posterFallback as unknown) as string);

    return (
        <div className="group bg-white/95 text-black rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5 hover:shadow-md transition-all">
            <div className="flex gap-0">
                {/* Poster — bigger & prettier */}
                <div className="relative w-[150px] h-[150px] shrink-0">
                    <img
                        src={src}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = (posterFallback as unknown) as string;
                        }}
                    />
                    {/* gradient bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
                    {/* ⛔️ Status badge removed */}
                    {/* Event ID chip (keep) */}
                    <div className="absolute bottom-2 left-2 bg-white/85 backdrop-blur px-2 py-0.5 text-[10px] font-semibold rounded-full ring-1 ring-black/10">
                        ID: {String(item.eventId ?? "-")}
                    </div>
                </div>

                {/* Right content */}
                <div className="flex-1 px-4 py-3">
                    <div className="font-bold text-sm leading-tight line-clamp-2 pr-2 group-hover:underline">
                        {item.title}
                    </div>

                    <div className="mt-1 space-y-1 text-[12px] text-gray-700">
                        <div className="flex items-center gap-1 min-w-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
                                <circle cx="12" cy="11" r="2.5" />
                            </svg>
                            <span className="truncate">{item.venue || "-"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>{item.showDate || "-"}</span>
                        </div>
                    </div>

                    {/* ⛔️ ลบกริด VIP / ZONE / ROW / COLUMN / TOTAL ออกแล้ว */}
                </div>
            </div>
        </div>
    );
}

function MiniTicketSkeleton() {
    return (
        <div className="bg-white/90 rounded-2xl overflow-hidden shadow-sm ring-1 ring-black/5">
            <div className="flex">
                <div className="w-[150px] h-[150px] animate-pulse bg-gray-200" />
                <div className="flex-1 p-3 space-y-3">
                    <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}
