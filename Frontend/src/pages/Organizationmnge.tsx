"use client";

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
    category: CategoryName | string;
    status: "PENDING" | "APPROVED" | "REJECTED" | string;
    updatedAt?: string;
    sortTs: number;
    sortTiebreaker: number;
};

function StatusBadge({ status }: { status: string }) {
    const s = (status || "").toUpperCase();
    const style =
        s === "APPROVED"
            ? "bg-emerald-100 text-emerald-700 ring-emerald-200"
            : s === "REJECTED"
                ? "bg-rose-100 text-rose-700 ring-rose-200"
                : "bg-amber-100 text-amber-800 ring-amber-200"; // PENDING
    const label =
        s === "APPROVED" ? "Approved" : s === "REJECTED" ? "Rejected" : "Pending";
    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ring-1 ${style}`}
        >
      {label}
    </span>
    );
}

export default function Organizationmnge() {
    const location = useLocation() as any;
    const [flash, setFlash] = useState<string | null>(location.state?.flash ?? null);

    // filters
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<CategoryName | "all">("all");
    const [order, setOrder] = useState<Order>("newest");

    // data
    const [events, setEvents] = useState<EventItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        if (location.state?.flash) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        const t = setTimeout(() => setFlash(null), 3000);
        return () => clearTimeout(t);
    }, [location.state]);

    // ===== helpers =====
    const mapCategory = (raw: any): CategoryName | string => {
        const id = raw?.categoryId ?? raw?.category_id ?? raw?.category ?? null;
        if (typeof id === "string") {
            const low = id.toLowerCase();
            if (low === "concert" || low === "seminar" || low === "exhibition") return low as CategoryName;
            return id;
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

    // ===== load data =====
    const loadEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            // baseURL = "/api" แล้ว → ใช้ "/events/mine" เท่านั้น
            const res = await api.get("/events/mine");
            const data = Array.isArray(res.data) ? res.data : [];

            const mapped: EventItem[] = data.map((ev: any, idx: number) => {
                const t = ev.startDateTime ?? ev.updatedAt ?? ev.createdAt;
                const ts = t ? Date.parse(t) : Date.now();
                return {
                    id: ev.id ?? ev.eventId ?? idx,
                    title: ev.eventName ?? ev.name ?? "Untitled Event",
                    category: mapCategory(ev),
                    status: String(ev.status ?? "PENDING").toUpperCase(),
                    updatedAt: t,
                    sortTs: Number.isFinite(ts) ? ts : Date.now(),
                    sortTiebreaker: Number.isFinite(Number(ev.id ?? ev.eventId))
                        ? Number(ev.id ?? ev.eventId)
                        : idx,
                };
            });

            setEvents(mapped);
        } catch (e: any) {
            console.error("[Organization] fetch mine failed:", e);
            setEvents([]);
            setError(e?.response?.data?.message || e.message || "โหลดข้อมูลอีเวนต์ไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadEvents();
    }, []);

    // ===== derived list =====
    const filtered = useMemo(() => {
        let list = [...events];
        if (category !== "all")
            list = list.filter((e) => (e.category as string).toLowerCase() === category);
        if (query.trim()) {
            const q = query.toLowerCase();
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
    }, [events, category, query, order]);

    // ===== UI =====
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
                            onChange={(v) => setCategory(v as CategoryName | "all")}
                        />

                        <div className="flex items-center gap-3">
                            <Ordertoggle value={order} onChange={setOrder} />
                            <div className="w-[320px]">
                                <SearchBar value={query} onChange={setQuery} placeholder="Search events..." />
                            </div>
                            {/* ✅ เหลือเฉพาะปุ่ม CREATE EVENT ขวาบน */}
                            <PrimaryButton to="/eventdetail" className="whitespace-nowrap">
                                <Plus className="h-5 w-5 mr-2" />
                                CREATE EVENT
                            </PrimaryButton>
                        </div>
                    </div>
                </div>

                {/* ตาราง/การ์ดอีเวนต์ */}
                {error && (
                    <div className="mt-6 rounded-md bg-red-100 text-red-800 px-4 py-3 border border-red-300">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-gray-700 text-center py-10">Loading events...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-gray-600 text-center py-10">ยังไม่มีอีเวนต์</div>
                ) : (
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
                )}
            </div>
        </div>
    );
}
