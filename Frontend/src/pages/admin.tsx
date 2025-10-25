"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import EventToolbar from "@/components/EventToolbar";
import { Badge } from "@/components/badge";
import { api } from "@/lib/api";
import AuthImage from "@/components/AuthImage";
import posterFallback from "@/assets/poster.png";

// ---------- Types ----------
type EffectiveStatus = "ONSALE" | "OFFSALE" | "UPCOMING";
type Order = "newest" | "oldest";

type Event = {
    id: string | number;
    cover: string;
    eventName: string;
    organizer: string;
    startSaleDate?: string;
    endSaleDate?: string;
    location?: string;
    status: EffectiveStatus;
    category: string;
    date?: string;
    saleSeat?: string;
    updatedAt?: string;
};

// ---------- Helpers ----------
const fmtDateTime = (iso?: string) =>
    iso
        ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).format(new Date(iso))
        : "-";

function withinSaleWindow(start?: string, end?: string): boolean {
    if (!start || !end) return false;
    const now = Date.now();
    const s = +new Date(start);
    const e = +new Date(end);
    return now >= s && now <= e;
}

function isUpcoming(start?: string): boolean {
    if (!start) return false;
    const now = Date.now();
    const s = +new Date(start);
    const diffDays = (s - now) / (1000 * 60 * 60 * 24);
    return diffDays <= 7 && diffDays > 0;
}

function categoryLabel(id?: number | null): string {
    if (id === 1) return "concert";
    if (id === 2) return "seminar";
    if (id === 3) return "exhibition";
    return "other";
}

const coverPath = (id: string | number, updatedAt?: string) =>
    `/admin/events/${id}/cover${updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : ""}`;

function statusBadgeClass(status: EffectiveStatus) {
    switch (status) {
        case "ONSALE":
            return "bg-emerald-100 text-emerald-800 whitespace-nowrap";
        case "UPCOMING":
            return "bg-amber-100 text-amber-800 whitespace-nowrap";
        default:
            return "bg-zinc-200 text-zinc-800 whitespace-nowrap";
    }
}

// ---------- Page ----------
export default function AdminEventManagementPage() {
    const navigate = useNavigate();

    const [statusFilter, setStatusFilter] = useState<"all" | EffectiveStatus>("all");
    const [order, setOrder] = useState<Order>("newest");
    const [search, setSearch] = useState("");

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);
    const pageSize = 6;

    // ✅ โหลดข้อมูลจริงจาก backend
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await api.get("/admin/events", { params: { status: "APPROVED" } });
                const arr: any[] = Array.isArray(res.data) ? res.data : [];

                const mapped: Event[] = arr.map((it) => {
                    const id =
                        it.id ?? it.eventId ?? it.event_id ?? it.eventsNamId ?? it.events_id;

                    const start =
                        it.salesStartDateTime ??
                        it.sales_start_datetime ??
                        it.startDateTime ??
                        it.startDatetime;

                    const end =
                        it.salesEndDateTime ??
                        it.sales_end_datetime ??
                        it.endDateTime ??
                        it.endDatetime;

                    const showDate =
                        it.showDateTime ??
                        it.eventDate ??
                        it.startDateTime ??
                        it.startDatetime;

                    const sold = it.quantitySold ?? it.sold ?? it.soldSeats ?? null;
                    const total = it.quantityAvailable ?? it.total ?? it.maxCapacity ?? null;
                    const saleSeat =
                        sold != null && total != null ? `${sold} / ${total}` : "—";

                    const category =
                        it.category ?? categoryLabel(it.categoryId ?? it.category_id);
                    const eventName = it.eventName ?? it.name ?? "-";
                    const organizer = it.organizerName ?? it.organizer ?? "-";
                    const location = it.venueName ?? it.location ?? "-";
                    const updatedAt =
                        it.updatedAt ?? it.updated_at ?? it.cover_updated_at ?? it.modifiedAt;

                    // ✅ เพิ่ม logic upcoming
                    let status: EffectiveStatus = "OFFSALE";
                    if (withinSaleWindow(start, end)) status = "ONSALE";
                    else if (isUpcoming(start)) status = "UPCOMING";

                    return {
                        id,
                        cover: coverPath(id, updatedAt),
                        eventName,
                        organizer,
                        startSaleDate: start,
                        endSaleDate: end,
                        location,
                        status,
                        category: String(category ?? "other"),
                        date: showDate,
                        saleSeat,
                        updatedAt,
                    };
                });

                setEvents(mapped);
            } catch (e) {
                console.error(e);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [statusFilter, search, order]);

    const categoryOptions = [
        { label: "Show all", value: "all" },
        { label: "ONSALE", value: "ONSALE" },
        { label: "UPCOMING", value: "UPCOMING" },
        { label: "OFFSALE", value: "OFFSALE" },
    ];

    const filtered = useMemo(() => {
        let list = events;

        if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);

        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter(
                (e) =>
                    e.eventName.toLowerCase().includes(q) ||
                    (e.organizer || "").toLowerCase().includes(q) ||
                    (e.location || "").toLowerCase().includes(q)
            );
        }

        list = [...list].sort((a, b) => {
            const da = +new Date(a.date ?? a.startSaleDate ?? 0);
            const db = +new Date(b.date ?? b.startSaleDate ?? 0);
            return order === "newest" ? db - da : da - db;
        });

        return list;
    }, [events, statusFilter, search, order]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

    return (
        <div className="min-h-screen bg-gray-100">
            <Sidebar />
            <div className="ml-64 p-8">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between gap-4 relative">
                        <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
                        <div className="relative">
                            <EventToolbar
                                categories={categoryOptions}
                                category={statusFilter}
                                onCategoryChange={(v) => setStatusFilter(v as "all" | EffectiveStatus)}
                                order={order}
                                onOrderChange={setOrder}
                                search={search}
                                onSearchChange={setSearch}
                            />
                        </div>
                    </div>

                    {/* Results info */}
                    <div className="mb-3 text-sm text-gray-600">
                        Page <span className="font-medium">{page}</span> • Showing{" "}
                        <span className="font-medium">{filtered.length}</span> of{" "}
                        <span className="font-medium">{events.length}</span> events
                    </div>

                    {/* Table */}
                    <div className="rounded-lg bg-white shadow-sm overflow-x-auto">
                        <table className="w-full">
                            <thead className="sticky top-0 z-[1] border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Poster</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Event Name</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Organizer</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Show Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Sale Period</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Sale seat</th>
                            </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={`sk-${i}`} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-16 w-12 rounded bg-gray-200" /></td>
                                        <td className="px-6 py-4"><div className="mb-2 h-4 w-48 rounded bg-gray-200" /><div className="h-3 w-24 rounded bg-gray-100" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-gray-200" /></td>
                                        <td className="px-6 py-4"><div className="h-3 w-32 rounded bg-gray-200" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-40 rounded bg-gray-200" /></td>
                                        <td className="px-6 py-4"><div className="h-6 w-20 rounded bg-gray-200" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200" /></td>
                                    </tr>
                                ))
                            ) : pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-gray-600">
                                        ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข
                                    </td>
                                </tr>
                            ) : (
                                pageItems.map((event) => (
                                    <tr
                                        key={event.id}
                                        className="cursor-pointer transition-colors hover:bg-gray-50"
                                        onClick={() => navigate(`/admin/eventdetail?id=${event.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <AuthImage
                                                src={event.cover}
                                                alt={String(event.eventName)}
                                                fallback={posterFallback}
                                                className="h-16 w-12 rounded object-cover"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {event.eventName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                ({event.category})
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{event.organizer}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{fmtDateTime(event.date)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {event.startSaleDate ? fmtDateTime(event.startSaleDate) : "-"} →{" "}
                                                {event.endSaleDate ? fmtDateTime(event.endSaleDate) : "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{event.location}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge className={statusBadgeClass(event.status)}>{event.status}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{event.saleSeat ?? "—"}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Page <span className="font-medium">{page}</span> of{" "}
                            <span className="font-medium">{totalPages}</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i + 1)}
                                    className={`rounded-md border px-3 py-1.5 text-sm ${
                                        page === i + 1 ? "bg-gray-900 text-white" : "hover:bg-gray-50"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="rounded-md border px-3 py-1.5 text-sm disabled:opacity-50 hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}