// src/pages/Landing.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PosterCard from "@/components/PosterCard";
import CategoryRadio from "@/components/CategoryRadio";
import PrimaryButton from "@/components/PrimaryButton";
import OutlineButton from "@/components/OutlineButton";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";

// assets
import poster1 from "@/assets/poster.png";
import poster2 from "@/assets/poster2.png";
import poster3 from "@/assets/poster3.png";
import poster4 from "@/assets/poster4.png";
import poster5 from "@/assets/poster5.png";
import poster6 from "@/assets/poster6.png";
import poster7 from "@/assets/poster7.png";
import poster8 from "@/assets/poster8.png";

type Poster = { dateLabel: string; title: string; imageUrl: string; eventId?: number };

type EventCardApi = {
    id: number;
    eventName: string;
    categoryId?: number | null;
    salesStartDatetime?: string | null;
    salesEndDatetime?: string | null;
    coverUrl?: string | null;
    venueName?: string | null;
};

type Effective = "ONSALE" | "OFFSALE" | "UPCOMING";

type EventItemUI = {
    id: number;
    cover: string;
    dateRange: string;
    title: string;
    venue: string;
    category: string;
    effectiveStatus: Effective;
};

const posters = [poster1, poster2, poster3, poster4, poster5, poster6, poster7, poster8];

export const posterData: Poster[] = [
    { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[0] },
    { dateLabel: "[2025.07.27]", title: "THE RIVER BROS", imageUrl: posters[2] },
    { dateLabel: "[2025.07.27]", title: "CREATIVE POSTER EXHIBITION", imageUrl: posters[3] },
    { dateLabel: "[2025.07.27]", title: "ROBERT BALTAZAR TRIO", imageUrl: posters[4] },
    { dateLabel: "[2025.07.27]", title: "IN RIVER DANCE", imageUrl: posters[7] },
];

// ===== Helpers =====
function useDebounced<T>(value: T, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const h = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(h);
    }, [value, delay]);
    return debouncedValue;
}

function fmtRange(start?: string | null, end?: string | null) {
    if (!start || !end) return "-";
    const s = new Date(start);
    const e = new Date(end);
    const f = new Intl.DateTimeFormat("th-TH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
    return `${f.format(s)} – ${f.format(e)}`;
}

function categoryLabelFromId(catId?: number | null): string {
    if (catId == null) return "Other";
    const map: Record<number, string> = { 1: "Concert", 2: "Seminar", 3: "Exhibition" };
    return map[catId] ?? "Other";
}

const coverOrFallback = (url?: string | null) => (url && url.length > 0 ? url : poster1);

/** ✅ คำนวณสถานะจากช่วงขาย
 *  - ONSALE   : now อยู่ระหว่าง start..end
 *  - UPCOMING : now < start   (ไม่จำกัด 7 วัน)
 *  - OFFSALE  : อื่น ๆ
 */
function computeEffectiveStatus(start?: string | null, end?: string | null): Effective {
    if (!start || !end) return "OFFSALE";
    const now = Date.now();
    const s = +new Date(start);
    const e = +new Date(end);
    if (now >= s && now <= e) return "ONSALE";
    if (now < s) return "UPCOMING";
    return "OFFSALE";
}

/** รวม array ตาม id — ของหลังทับของก่อน */
function mergeUniqueById(a: EventCardApi[], b: EventCardApi[]): EventCardApi[] {
    const map = new Map<number, EventCardApi>();
    for (const x of a) map.set(x.id, x);
    for (const x of b) map.set(x.id, x);
    return Array.from(map.values());
}

// ===== Mock Events ===== (ให้เป็น UPCOMING ไว้โชว์ layout เฉย ๆ)
const mockEvents: EventItemUI[] = Array.from({ length: 24 }).map((_, i) => {
    const p = posters[i % posters.length];
    return {
        id: -(i + 1),
        cover: p,
        dateRange: "01 ม.ค. 2025 – 31 ม.ค. 2025",
        title: `Mock Event #${i + 1}`,
        venue: ["MCC Hall", "Impact Arena", "BITEC", "ICONSIAM Hall"][i % 4],
        category: ["Concert", "Seminar", "Exhibition"][i % 3],
        effectiveStatus: "UPCOMING",
    };
});

function mergeWithMocks(realItems: EventItemUI[], mocks: EventItemUI[], maxCount = 40): EventItemUI[] {
    const seen = new Set<number>();
    const out: EventItemUI[] = [];
    for (const it of realItems) {
        if (!seen.has(it.id)) {
            out.push(it);
            seen.add(it.id);
        }
    }
    for (const it of mocks) {
        if (out.length >= maxCount) break;
        if (!seen.has(it.id)) {
            out.push(it);
            seen.add(it.id);
        }
    }
    return out;
}

export default function LandingPage() {
    const navigate = useNavigate();

    // UI states
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounced(searchQuery, 300);
    const [eventFilter, setEventFilter] = useState("All");
    const INITIAL_COUNT = 10;
    const LOAD_STEP = 10;
    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

    // marquee states
    const DRAG_THRESHOLD = 6;
    const [isDragging, setIsDragging] = useState(false);
    const [isPointerDown, setIsPointerDown] = useState(false);
    const [isAnimationPaused, setIsAnimationPaused] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Countdown target (ใช้ event จริง ถ้าไม่มีใช้ fallback +10 วัน)
    const [targetDate, setTargetDate] = useState<Date | null>(null);
    const [nextOnSaleEvent, setNextOnSaleEvent] = useState<EventCardApi | null>(null);

// Data from API
    const [rawEvents, setRawEvents] = useState<EventCardApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                // โหลดทั้ง onSale และ upcoming แล้วรวม
                const [r1, r2] = await Promise.all([
                    fetch("/api/public/events/landing?section=onSale"),
                    fetch("/api/public/events/landing?section=upcoming"),
                ]);

                if (!r1.ok) throw new Error(`HTTP ${r1.status} (onSale)`);
                if (!r2.ok) throw new Error(`HTTP ${r2.status} (upcoming)`);

                const d1: EventCardApi[] = await r1.json();
                const d2: EventCardApi[] = await r2.json();

                setRawEvents(mergeUniqueById(d1, d2));
            } catch (e: any) {
                setErr(e?.message ?? "Load failed");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const now = Date.now();

        // กรณีไม่มี event เลย → ใช้ fallback (อีก 10 วันข้างหน้า)
        if (!rawEvents || rawEvents.length === 0) {
            const d = new Date();
            d.setDate(d.getDate() + 10);
            d.setHours(12, 56, 25, 0);
            setTargetDate(d);
            setNextOnSaleEvent(null);
            return;
        }

        // เลือกเฉพาะ event ที่ salesStart อยู่ในอนาคต
        const upcoming = rawEvents.filter(
            (ev) => ev.salesStartDatetime && +new Date(ev.salesStartDatetime) > now
        );

        if (upcoming.length === 0) {
            // ไม่มี event ที่กำลังจะเริ่มขาย → ใช้ fallback
            const d = new Date();
            d.setDate(d.getDate() + 10);
            d.setHours(12, 56, 25, 0);
            setTargetDate(d);
            setNextOnSaleEvent(null);
            return;
        }

        // หา salesStartDatetime ที่ใกล้ที่สุด
        upcoming.sort(
            (a, b) =>
                +new Date(a.salesStartDatetime as string) -
                +new Date(b.salesStartDatetime as string)
        );

        const next = upcoming[0];
        setTargetDate(new Date(next.salesStartDatetime as string));
        setNextOnSaleEvent(next);
    }, [rawEvents]);



    // map real -> UI + คำนวณสถานะ + ตัด OFFSALE ออก
    const realUI: EventItemUI[] = useMemo(() => {
        const mapped = (rawEvents ?? []).map((e) => {
            const eff = computeEffectiveStatus(e.salesStartDatetime ?? null, e.salesEndDatetime ?? null);
            return {
                id: e.id,
                cover: coverOrFallback(e.coverUrl),
                dateRange: fmtRange(e.salesStartDatetime ?? null, e.salesEndDatetime ?? null),
                title: e.eventName,
                venue: e.venueName ?? "-",
                category: categoryLabelFromId(e.categoryId ?? null),
                effectiveStatus: eff,
            } as EventItemUI;
        });
        // **ไม่แสดง OFFSALE บนหน้า Landing**
        return mapped.filter((m) => m.effectiveStatus !== "OFFSALE");
    }, [rawEvents]);

    // ใช้ event จริงก่อน ถ้าไม่มีเลยค่อย fallback เป็น mock
    const uiEventsAll: EventItemUI[] = useMemo(() => {
        if (realUI.length > 0) {
            return realUI;
        }
        return mockEvents;
    }, [realUI]);


    // 🔁 โปสเตอร์สำหรับแถบเลื่อน
// - ใช้ event จริงเป็นหลัก
// - ถ้า event น้อยจะวนซ้ำให้ได้อย่างน้อย MIN_ITEMS ชิ้น
// - ถ้าไม่มี event จริงเลย → ใช้ posterData (mock) เป็น fallback
    const marqueePosters: Poster[] = useMemo(() => {
        const MIN_ITEMS = 8; // อยากให้ base loop ยาวประมาณกี่ใบก็ปรับเลขตรงนี้ได้

        const realEvents = realUI.filter((e) => e.id > 0);
        if (realEvents.length > 0) {
            const result: Poster[] = [];
            const rawById = new Map(rawEvents.map((r) => [r.id, r]));

            while (result.length < MIN_ITEMS) {
                for (const ev of realEvents) {
                    if (result.length >= MIN_ITEMS) break;

                    const raw = rawById.get(ev.id);
                    let dateLabel = "";

                    if (raw?.salesStartDatetime) {
                        const d = new Date(raw.salesStartDatetime);
                        const f = new Intl.DateTimeFormat("th-TH", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        });
                        dateLabel = `[${f.format(d)}]`;
                    }

                    result.push({
                        dateLabel,
                        title: ev.title,
                        imageUrl: ev.cover,
                        eventId: ev.id,
                    });
                }
            }

            return result;
        }

        // ไม่มี event จริงเลย → ใช้ mock poster เดิม
        return posterData;
    }, [realUI, rawEvents]);

    // เลือก Featured event จากของจริง (ถ้ามี)
    const featuredEvent = useMemo(() => {
        if (realUI.length === 0) return null;

        const onSale = realUI.find((e) => e.effectiveStatus === "ONSALE");
        if (onSale) return onSale;

        return realUI[0];
    }, [realUI]);



    // หมวดหมู่ dynamic
    const dynamicCategories = useMemo(() => {
        const set = new Set<string>();
        uiEventsAll.forEach((ev) => set.add(ev.category));
        const cats = Array.from(set);
        cats.sort();
        return ["All", ...cats];
    }, [uiEventsAll]);

    // ฟิลเตอร์ + ค้นหา
    const filteredEvents = useMemo(() => {
        let filtered = uiEventsAll;

        if (eventFilter !== "All") {
            filtered = filtered.filter((e) => e.category === eventFilter);
        }
        if (debouncedSearchQuery.trim()) {
            const q = debouncedSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(
                (e) =>
                    e.title.toLowerCase().includes(q) ||
                    e.venue.toLowerCase().includes(q) ||
                    e.category.toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [uiEventsAll, eventFilter, debouncedSearchQuery]);

    // reset visible
    useEffect(() => {
        setVisibleCount(INITIAL_COUNT);
    }, [eventFilter, debouncedSearchQuery]);

    const scrollToEventsSection = () => {
        const el = document.getElementById("events-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    // marquee handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!scrollContainerRef.current) return;
        setIsPointerDown(true);
        setIsDragging(false);
        setIsAnimationPaused(true);
        setDragStart({ x: e.pageX, scrollLeft: scrollContainerRef.current.scrollLeft });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isPointerDown || !scrollContainerRef.current) return;
        const dx = Math.abs(e.pageX - dragStart.x);
        if (!isDragging && dx > DRAG_THRESHOLD) setIsDragging(true);
        if (isDragging) {
            e.preventDefault();
            const walk = (e.pageX - dragStart.x) * 2;
            scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
        }
    };
    const handleMouseUp = () => {
        setIsPointerDown(false);
        setIsDragging(false);
        setTimeout(() => setIsAnimationPaused(false), 300);
    };
    const handleMouseLeave = () => {
        setIsPointerDown(false);
        setIsDragging(false);
        setTimeout(() => setIsAnimationPaused(false), 300);
    };
    const handleTouchStart = (e: React.TouchEvent) => {
        if (!scrollContainerRef.current) return;
        setIsPointerDown(true);
        setIsDragging(false);
        setIsAnimationPaused(true);
        setDragStart({ x: e.touches[0].clientX, scrollLeft: scrollContainerRef.current.scrollLeft });
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isPointerDown || !scrollContainerRef.current) return;
        const dx = Math.abs(e.touches[0].clientX - dragStart.x);
        if (!isDragging && dx > DRAG_THRESHOLD) setIsDragging(true);
        if (isDragging) {
            const walk = (e.touches[0].clientX - dragStart.x) * 2;
            scrollContainerRef.current.scrollLeft = dragStart.scrollLeft - walk;
        }
    };
    const handleTouchEnd = () => {
        setIsPointerDown(false);
        setIsDragging(false);
        setTimeout(() => setIsAnimationPaused(false), 300);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleScroll = () => {
            if (!container) return;
            const { scrollWidth, scrollLeft } = container;
            if (scrollLeft >= scrollWidth / 2) container.scrollLeft = 0;
            if (scrollLeft <= 0) container.scrollLeft = scrollWidth / 2;
        };
        container.addEventListener("scroll", handleScroll);
        container.scrollLeft = container.scrollWidth / 4;
        return () => container.removeEventListener("scroll", handleScroll);
    }, []);

    const firstRealEventId = realUI.find((e) => e.id > 0)?.id;


    return (
        <>
            <style>{`
        @keyframes scroll-infinite { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll-infinite { animation: scroll-infinite 30s linear infinite; }
        .animate-scroll-infinite.paused { animation-play-state: paused; }
        .poster-container { padding: 15px 10px; user-select: none; }
        .draggable-container { cursor: grab; overflow-x: auto; scrollbar-width: none; -ms-overflow-style: none; }
        .draggable-container::-webkit-scrollbar { display: none; }
        .draggable-container.dragging { cursor: grabbing; }
        .draggable-container.dragging * { pointer-events: none; }
      `}</style>

            <div className="min-h-screen bg-[#DBDBDB]">
                {/* Hero */}
                <section className="px-6 py-16">
                    <div className="text-center mb-5">
                        <h1 className="text-[min(9vw,200px)] font-extrabold leading-tight">
                            LIVE THE VIBE ON
                        </h1>
                        <div className="flex justify-center gap-4 mb-12 pt-8">
                            <PrimaryButton onClick={scrollToEventsSection} className="px-8 py-3">
                                ALL EVENT
                            </PrimaryButton>
                            <OutlineButton className="px-8 py-3" to="/OrganizerLogin">
                                ORGANIZER
                            </OutlineButton>
                        </div>
                    </div>

                    <div className="relative overflow-hidden py-5">
                        <div
                            ref={scrollContainerRef}
                            className={`draggable-container ${isDragging ? "dragging" : ""}`}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            style={{ margin: "20px 0" }}
                        >
                            <div
                                className={`${
                                    isAnimationPaused
                                        ? "animate-scroll-infinite paused"
                                        : "animate-scroll-infinite"
                                } flex gap-4`}
                            >
                                {[...marqueePosters, ...marqueePosters].map((poster, index) => {
                                    const handleClick = () => {
                                        if (isDragging) return;

                                        if (poster.eventId && poster.eventId > 0) {
                                            navigate(`/eventselect/${poster.eventId}`);
                                        } else if (firstRealEventId) {
                                            navigate(`/eventselect/${firstRealEventId}`);
                                        } else {
                                            scrollToEventsSection();
                                        }
                                    };

                                    return (
                                        <div key={`poster-${index}`} className="flex-shrink-0 poster-container">
                                            <div className="transition-transform duration-300 hover:scale-105 will-change-transform">
                                                <PosterCard
                                                    dateLabel={poster.dateLabel}
                                                    title={poster.title}
                                                    imageUrl={poster.imageUrl}
                                                    onClick={handleClick}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Countdown Section แบบในรูป: แถบแดง + พื้นดำ + ปุ่ม */}
                {targetDate && nextOnSaleEvent && (
                    <>
                        {/* แถบแดงด้านบน (ใช้ CountdownTimer เดิม) */}
                        <CountdownTimer targetDate={targetDate} />

                        {/* พื้นดำ + รูป + ข้อมูล event + ปุ่ม */}
                        <section className="bg-[#1D1D1D] text-white py-12 px-6">
                            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                                <div>
                                    <img
                                        src={coverOrFallback(nextOnSaleEvent.coverUrl)}
                                        alt={nextOnSaleEvent.eventName}
                                        className="w-full max-w-md mx-auto rounded-lg"
                                    />
                                </div>

                                <div className="text-center md:text-left">
                                    {/* วันที่สั้น ๆ แบบ 2024.03.22 */}
                                    <div className="text-[clamp(16px,3vw,20px)] font-bold text-white mb-2">
                                        {nextOnSaleEvent.salesStartDatetime
                                            ? (() => {
                                                const d = new Date(
                                                    nextOnSaleEvent.salesStartDatetime as string
                                                );
                                                const y = d.getFullYear();
                                                const m = String(d.getMonth() + 1).padStart(2, "0");
                                                const day = String(d.getDate()).padStart(2, "0");
                                                return `${y}.${m}.${day}`;
                                            })()
                                            : ""}
                                    </div>

                                    {/* ชื่อ event ตัวใหญ่สีแดง */}
                                    <h2 className="text-[clamp(28px,6vw,48px)] font-extrabold text-[#FA3A2B] mb-4 leading-tight">
                                        {nextOnSaleEvent.eventName}
                                    </h2>

                                    {/* คำอธิบาย: ยังไม่มีจาก DB ใช้ข้อความ template ไปก่อน */}
                                    <p className="text-gray-300 mb-6 leading-relaxed">
                                        Lorem Ipsum is simply dummy text of the printing and
                                        typesetting industry. You can replace this text with your
                                        event description later.
                                    </p>

                                    <PrimaryButton
                                        onClick={() => navigate(`/eventselect/${nextOnSaleEvent.id}`)}
                                        className="px-8 py-3"
                                    >
                                        VIEW
                                    </PrimaryButton>
                                </div>
                            </div>
                        </section>
                    </>
                )}

                {/* Events Section */}
                <section id="events-section" className="py-12 px-6">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-center text-[clamp(28px,6vw,80px)] font-extrabold text-black pb-8 pt-20 leading-tight">
                            <span className="text-[#FA3A2B]">ALL</span> VIBE LONG{" "}
                            <span className="text-[#FA3A2B]">STAGE</span> ON FIRE
                        </h2>

                        {/* Toolbar */}
                        <div className="flex flex-col items-center gap-3 mb-8">
                            <SearchBar
                                value={searchQuery}
                                onChange={setSearchQuery}
                                placeholder="Search events..."
                                width="w-full max-w-2xl"
                                height="h-12"
                                className="rounded-full"
                            />
                            <div className="w-full flex justify-center">
                                <CategoryRadio
                                    options={dynamicCategories.map((c) => ({ label: c, value: c }))}
                                    value={eventFilter}
                                    onChange={setEventFilter}
                                />
                            </div>
                        </div>

                        {/* states */}
                        {loading && (
                            <div className="text-center text-gray-500 py-10">
                                กำลังโหลดรายการอีเวนต์...
                            </div>
                        )}
                        {err && (
                            <div className="text-center text-red-600 py-10">
                                โหลดล้มเหลว: {err}
                            </div>
                        )}

                        {/* Event Cards */}
                        {!loading && !err && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 justify-items-center">
                                {filteredEvents.length > 0 ? (
                                    filteredEvents.slice(0, visibleCount).map((event) => (
                                        <EventCard
                                            key={event.id}
                                            cover={event.cover}
                                            dateRange={event.dateRange}
                                            title={event.title}
                                            venue={event.venue}
                                            effectiveStatus={event.effectiveStatus}
                                            onClickGetTicket={() =>
                                                event.id > 0
                                                    ? navigate(`/eventselect/${event.id}`)
                                                    : undefined
                                            }
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No events found
                                        </h3>
                                        <p className="text-gray-500 mb-4">
                                            Try adjusting your search terms or filters.
                                        </p>
                                        <button
                                            onClick={() => {
                                                setSearchQuery("");
                                                setEventFilter("All");
                                            }}
                                            className="text-[#FA3A2B] hover:text-[#e8342a] font-medium"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show More/Less */}
                        {!loading && !err && filteredEvents.length > 0 && (
                            <div className="text-center mt-12">
                                {visibleCount < filteredEvents.length ? (
                                    <OutlineButton
                                        onClick={() =>
                                            setVisibleCount((n) =>
                                                Math.min(n + LOAD_STEP, filteredEvents.length)
                                            )
                                        }
                                    >
                                        Show more ({filteredEvents.length - visibleCount} remaining)
                                    </OutlineButton>
                                ) : filteredEvents.length > INITIAL_COUNT ? (
                                    <OutlineButton onClick={() => setVisibleCount(INITIAL_COUNT)}>
                                        Show less
                                    </OutlineButton>
                                ) : null}
                            </div>
                        )}
                    </div>
                </section>

                <Footer />
            </div>
        </>
    );
}
