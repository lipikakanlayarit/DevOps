import { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Ordertoggle from "@/components/OrderToggle";
import CategoryRadio from "@/components/CategoryRadio";
import PrimaryButton from "@/components/PrimaryButton";
import { api } from "@/lib/api";

type EventItem = {
    id: number | string;
    title: string;
    category: "concert" | "seminar" | "exhibition" | "other";
    updatedAt: string; // ISO string
};

type Order = "newest" | "oldest";

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

    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true);

                // ✅ ใช้ instance เดิม (มี baseURL=/api) ⇒ ใส่ /events/mine พอ
                const res = await api.get("/events/mine");
                const data = res.data;
                console.log("[Organization] /events/mine raw =", data);

                // ✅ รองรับทั้ง camelCase และ snake_case จาก backend
                const normalized: EventItem[] = (Array.isArray(data) ? data : []).map((ev: any) => {
                    const id =
                        ev.id ??
                        ev.eventId ??
                        ev.event_id ??
                        String(Math.random()); // กันกรณีไม่เจอ id

                    const title =
                        ev.eventName ??
                        ev.event_name ??
                        ev.name ??
                        "Untitled Event";

                    // category ยังไม่มีฟิลด์ตรงในตาราง -> ใส่ other ไปก่อน (หรือ map จาก category_id ถ้าต้องการ)
                    const cat =
                        (ev.category ??
                            ev.category_name ??
                            "other").toString().toLowerCase();

                    const updated =
                        ev.updatedAt ??
                        ev.updated_at ??
                        ev.startDatetime ??
                        ev.start_datetime ??
                        new Date().toISOString();

                    return {
                        id,
                        title,
                        category: (["concert", "seminar", "exhibition"].includes(cat) ? cat : "other") as EventItem["category"],
                        updatedAt: new Date(updated).toString() === "Invalid Date" ? new Date().toISOString() : new Date(updated).toISOString(),
                    };
                });

                console.log("[Organization] normalized =", normalized);
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
        list.sort((a, b) =>
            order === "newest"
                ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
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
                        <div className="mb-4 rounded-md bg-green-100 text-green-900 px-4 py-3 shadow">{flash}</div>
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
                    <div className="mt-6 mb-2 rounded-md bg-green-100 text-green-900 px-4 py-3 shadow">{flash}</div>
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
                    <div className="grid grid-cols-[1fr_140px] items-center px-6 py-4 border-b border-gray-200">
                        <div className="text-lg font-semibold text-gray-900">Events</div>
                        <div className="text-lg font-semibold text-gray-900 text-right">Action</div>
                    </div>

                    {filtered.map((ev) => (
                        <div
                            key={ev.id}
                            className="grid grid-cols-[1fr_140px] items-center px-6 py-8 border-b last:border-b-0 border-gray-200"
                        >
                            <div className="text-[18px] text-gray-900">{ev.title}</div>
                            <div className="text-right">
                                <Link
                                    to={`/eventdashboard/${ev.id}`}
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
