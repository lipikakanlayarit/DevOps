// src/pages/Organizationmnge.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Ordertoggle from "@/components/OrderToggle";
import CategoryRadio from "@/components/CategoryRadio";
import PrimaryButton from "@/components/PrimaryButton";
import { api } from "@/lib/api";

type CategoryName = "concert" | "seminar" | "exhibition" | "other";
type Order = "newest" | "oldest";

type EventItem = {
    id: number | string;
    title: string;
    category: CategoryName;
    status: "PENDING" | "APPROVED" | "REJECTED" | string;
    updatedAt?: string;
    sortTs: number;
    sortTiebreaker: number;
};

function StatusBadge({ status }: { status: string }) {
    const s = (status || "").toUpperCase();
    const { bg, text, label } =
        s === "APPROVED"
            ? { bg: "bg-green-100", text: "text-green-800", label: "Approved" }
            : s === "REJECTED"
                ? { bg: "bg-red-100", text: "text-red-800", label: "Rejected" }
                : { bg: "bg-amber-100", text: "text-amber-800", label: "Pending" };

    return (
        <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}
        >
      {label}
    </span>
    );
}

export default function Organizationmnge() {
    const location = useLocation() as any;
    const [flash, setFlash] = useState<string | null>(location.state?.flash ?? null);

    useEffect(() => {
        if (location.state?.flash) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        const t = setTimeout(() => setFlash(null), 3000);
        return () => clearTimeout(t);
    }, [location.state]);

    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [category, setCategory] = useState<"all" | "concert" | "seminar" | "exhibition">("all");
    const [order, setOrder] = useState<Order>("newest");

    const mapCategory = (raw: any): CategoryName => {
        const id = raw?.categoryId ?? raw?.category_id ?? raw?.categoryid ?? raw?.category ?? null;
        if (typeof id === "string") {
            const low = id.toLowerCase();
            if (low === "concert" || low === "seminar" || low === "exhibition") return low as CategoryName;
        }
        const n = Number(id);
        switch (n) {
            case 1:
                return "concert";
            case 2:
                return "seminar";
            case 3:
                return "exhibition";
            default:
                return "other";
        }
    };

    const pickSortTs = (ev: any): { ts: number; pretty?: string } => {
        const candidates = [
            ev.updatedAt,
            ev.updated_at,
            ev.updated_at_utc,
            ev.createdAt,
            ev.created_at,
            ev.startDateTime,
            ev.startDatetime,
            ev.start_datetime,
        ].filter(Boolean) as string[];

        for (const s of candidates) {
            const t = Date.parse(s);
            if (!Number.isNaN(t)) return { ts: t, pretty: new Date(t).toISOString() };
        }
        return { ts: 0, pretty: undefined };
    };

    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true);
                const res = await api.get("/events/mine");
                const data = Array.isArray(res.data) ? res.data : [];
                const normalized: EventItem[] = data.map((ev: any) => {
                    const id = ev.id ?? ev.eventId ?? ev.event_id ?? String(Math.random());
                    const title = ev.eventName ?? ev.event_name ?? ev.name ?? "Untitled Event";
                    const categoryName = mapCategory(ev);
                    const { ts, pretty } = pickSortTs(ev);
                    const tie = Number(ev.id ?? ev.eventId ?? ev.event_id);
                    const sortTiebreaker = Number.isFinite(tie) ? tie : 0;

                    // รับ status จาก backend ถ้าไม่มีให้เป็น PENDING
                    const status = (ev.status ?? "PENDING").toString().toUpperCase();

                    return {
                        id,
                        title,
                        category: categoryName,
                        status,
                        updatedAt: pretty,
                        sortTs: ts,
                        sortTiebreaker,
                    };
                });
                setEvents(normalized);
            } catch (err) {
                console.error("[Organization] Failed to fetch events:", err);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, []);

    const hasEvents = events.length > 0;

    const filtered = useMemo(() => {
        let list = [...events];
        if (category !== "all") list = list.filter((e) => e.category === category);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((e) => e.title.toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            if (order === "newest") {
                if (b.sortTs !== a.sortTs) return b.sortTs - a.sortTs;
                return b.sortTiebreaker - a.sortTiebreaker;
            } else {
                if (a.sortTs !== b.sortTs) return a.sortTs - b.sortTs;
                return a.sortTiebreaker - b.sortTiebreaker;
            }
        });
        return list;
    }, [events, category, searchQuery, order]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#DBDBDB]">
                <p className="text-gray-700 text-lg">Loading events...</p>
            </div>
        );
    }

    if (!hasEvents) {
        return (
            <div className="bg-[#DBDBDB] min-h-screen flex flex-col">
                {flash && (
                    <div className="mx-auto mt-6 w-full max-w-[1200px] px-4">
                        <div className="mb-4 rounded-md bg-green-100 text-green-900 px-4 py-3 shadow">
                            {flash}
                        </div>
                    </div>
                )}

                <div className="mt-6 flex justify-end mr-4 sm:mr-6">
                    <CategoryRadio
                        options={[
                            { label: "All", value: "all" },
                            { label: "Concert", value: "concert" },
                            { label: "Seminar", value: "seminar" },
                            { label: "Exhibition", value: "exhibition" },
                        ]}
                        value={category}
                        onChange={(v) => setCategory(v as any)}
                    />
                </div>

                <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-4 mr-4 sm:mr-6 px-4 sm:px-0">
                    <Ordertoggle value={order} onChange={setOrder} />
                    <div className="w-full sm:w-96">
                        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events..." />
                    </div>
                </div>

                <main className="flex-1 flex justify-center items-center px-4">
                    <div className="text-center w-full max-w-sm">
                        <PrimaryButton to="/eventdetail" className="w-full sm:w-auto">
                            <Plus className="h-5 w-5 mr-3" />
                            Create Event
                        </PrimaryButton>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="bg-[#DBDBDB] min-h-screen">
            <div className="mx-auto max-w-[1200px] px-4 pb-10">
                {flash && (
                    <div className="mt-6 mb-2 rounded-md bg-green-100 text-green-900 px-4 py-3 shadow">
                        {flash}
                    </div>
                )}

                <div className="flex items-start justify-between pt-6">
                    <h1 className="text-[56px] leading-none font-extrabold text-[#1A1A1A]">All Event</h1>

                    <div className="flex flex-col items-end gap-3">
                        <CategoryRadio
                            options={[
                                { label: "All", value: "all" },
                                { label: "Concert", value: "concert" },
                                { label: "Seminar", value: "seminar" },
                                { label: "Exhibition", value: "exhibition" },
                            ]}
                            value={category}
                            onChange={(v) => setCategory(v as any)}
                        />

                        <div className="flex items-center gap-3">
                            <Ordertoggle value={order} onChange={setOrder} />
                            <div className="w-[320px]">
                                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events..." />
                            </div>
                            <PrimaryButton to="/eventdetail" className="whitespace-nowrap">
                                <Plus className="h-5 w-5 mr-2" />
                                Create Event
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* ตารางอีเวนต์ */}
                <div className="mt-6 rounded-xl bg-white shadow-sm overflow-hidden">
                    <div className="grid grid-cols-[1fr_240px] items-center px-6 py-4 border-b border-gray-200">
                        <div className="text-lg font-semibold text-gray-900">Events</div>
                        <div className="text-lg font-semibold text-gray-900 text-right">Status / Action</div>
                    </div>

                    {filtered.map((ev) => (
                        <div
                            key={ev.id}
                            className="grid grid-cols-[1fr_240px] items-center px-6 py-8 border-b last:border-b-0 border-gray-200"
                        >
                            <div className="text-[18px] text-gray-900">{ev.title}</div>

                            <div className="flex items-center justify-end gap-3">
                                <StatusBadge status={ev.status} />
                                <Link
                                    to={`/eventdetail/${ev.id}`}
                                    className="text-gray-800 hover:text-black underline-offset-2 hover:underline transition"
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
