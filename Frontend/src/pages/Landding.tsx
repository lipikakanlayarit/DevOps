// frontend/src/pages/LandingPage.tsx
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

// assets (ส่วนโปสเตอร์สไลด์ด้านบนยังเป็น mock ได้อยู่)
import poster1 from "@/assets/poster.png";
import poster2 from "@/assets/poster2.png";
import poster3 from "@/assets/poster3.png";
import poster4 from "@/assets/poster4.png";
import poster5 from "@/assets/poster5.png";
import poster6 from "@/assets/poster6.png";
import poster7 from "@/assets/poster7.png";
import poster8 from "@/assets/poster8.png";

type Poster = { dateLabel: string; title: string; imageUrl: string };

// === รูปแบบข้อมูลที่ Public API คืนมา ===
type EventCardApi = {
    id: number;
    eventName: string;
    categoryId?: number | null;
    salesStartDatetime?: string | null;
    salesEndDatetime?: string | null;
    coverUrl?: string | null;
    // ถ้าฝั่ง backend อนาคตเติม venueName มา ก็รองรับได้เลย
    venueName?: string | null;
};

// === รูปแบบที่ใช้กับ EventCard ของฝั่ง UI ===
type EventItemUI = {
    id: number;
    cover: string;
    dateRange: string;
    title: string;
    venue: string;
    category: string;
};

const posters = [poster1, poster2, poster3, poster4, poster5, poster6, poster7, poster8];

export const posterData: Poster[] = [
    { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[0] },
    { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[1] },
    { dateLabel: "[2025.07.27]", title: "THE RIVER BROS", imageUrl: posters[2] },
    { dateLabel: "[2025.07.27]", title: "CREATIVE POSTER EXHIBITION", imageUrl: posters[3] },
    { dateLabel: "[2025.07.27]", title: "ROBERT BALTAZAR TRIO", imageUrl: posters[4] },
    { dateLabel: "[2025.07.27]", title: "VICTIM by ...", imageUrl: posters[5] },
    { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[6] },
    { dateLabel: "[2025.07.27]", title: "IN RIVER DANCE", imageUrl: posters[7] },
];

// ====== Helpers ======
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

// แปลง categoryId เป็นชื่อ (ถ้ายังไม่มีตาราง category ฝั่ง FE จะ map คร่าว ๆ ไว้ก่อน)
function categoryLabelFromId(catId?: number | null): string {
    if (catId == null) return "Other";
    // ปรับ mapping ให้ตรง DB จริงได้ภายหลัง
    const map: Record<number, string> = {
        1: "Concert",
        2: "Seminar",
        3: "Exhibition",
    };
    return map[catId] ?? "Other";
}

// เลือก cover fallback
function coverOrFallback(url?: string | null) {
    return url && url.length > 0 ? url : poster1;
}

export default function HomePage() {
    const navigate = useNavigate();

    // ====== UI states ======
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounced(searchQuery, 300);
    const [eventFilter, setEventFilter] = useState("All");
    const INITIAL_COUNT = 10;
    const LOAD_STEP = 10;
    const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

    // ====== Drag marquee states (โปสเตอร์สไลด์ด้านบน) ======
    const DRAG_THRESHOLD = 6;
    const [isDragging, setIsDragging] = useState(false);
    const [isPointerDown, setIsPointerDown] = useState(false);
    const [isAnimationPaused, setIsAnimationPaused] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, scrollLeft: 0 });
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // ====== Countdown mock ======
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);
    targetDate.setHours(12, 56, 25, 0);

    // ====== Data from API ======
    const [rawEvents, setRawEvents] = useState<EventCardApi[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // โหลด “อีเวนต์ที่กำลังขาย” จาก Public API
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                setErr(null);
                const res = await fetch("/api/public/events/landing?section=onSale");
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data: EventCardApi[] = await res.json();
                setRawEvents(data);
            } catch (e: any) {
                setErr(e?.message ?? "Load failed");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // แปลงข้อมูลจาก API -> UI
    const uiEvents: EventItemUI[] = useMemo(() => {
        return (rawEvents ?? []).map((e) => ({
            id: e.id,
            cover: coverOrFallback(e.coverUrl),
            dateRange: fmtRange(e.salesStartDatetime ?? null, e.salesEndDatetime ?? null),
            title: e.eventName,
            venue: e.venueName ?? "-", // ถ้า backend ยังไม่ส่งมาก็แสดงขีดไว้ก่อน
            category: categoryLabelFromId(e.categoryId ?? null),
        }));
    }, [rawEvents]);

    // ทำรายการหมวดหมู่จากข้อมูลจริง (เติม All ไว้ต้นรายการ)
    const dynamicCategories = useMemo(() => {
        const set = new Set<string>();
        uiEvents.forEach((ev) => set.add(ev.category));
        const cats = Array.from(set);
        cats.sort();
        return ["All", ...cats];
    }, [uiEvents]);

    // ฟิลเตอร์ + ค้นหา
    const filteredEvents = useMemo(() => {
        let filtered = uiEvents;

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
    }, [uiEvents, eventFilter, debouncedSearchQuery]);

    // reset จำนวนการ์ดเมื่อเปลี่ยน filter/search
    useEffect(() => {
        setVisibleCount(INITIAL_COUNT);
    }, [eventFilter, debouncedSearchQuery]);

    const scrollToEventsSection = () => {
        const el = document.getElementById("events-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    // === Drag handlers (โปสเตอร์สไลด์) ===
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

    // Infinite scroll reset สำหรับ container โปสเตอร์
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

    return (
        <>
            <style>{`
        @keyframes scroll-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-infinite {
          animation: scroll-infinite 30s linear infinite;
        }
        .animate-scroll-infinite.paused {
          animation-play-state: paused;
        }
        .poster-container {
          padding: 15px 10px;
          user-select: none;
        }
        .draggable-container {
          cursor: grab;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
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
                            <div className={`${isAnimationPaused ? "animate-scroll-infinite paused" : "animate-scroll-infinite"} flex gap-4`}>
                                {[...posterData, ...posterData, ...posterData].map((poster, index) => (
                                    <div key={`poster-${index}`} className="flex-shrink-0 poster-container">
                                        <div className="transition-transform duration-300 hover:scale-105 will-change-transform">
                                            <PosterCard
                                                dateLabel={poster.dateLabel}
                                                title={poster.title}
                                                imageUrl={poster.imageUrl}
                                                onClick={() => !isDragging && scrollToEventsSection()}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Countdown */}
                <CountdownTimer targetDate={targetDate} />

                {/* Featured (ยังเป็น mock) */}
                <section className="bg-[#1D1D1D] text-white py-12 px-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <img src={poster1} alt="Featured" className="w-full max-w-md mx-auto rounded-lg" />
                            </div>
                            <div>
                                <div className="text-[clamp(16px,3vw,20px)] font-bold text-white mb-2">2024.03.22</div>
                                <h2 className="text-[clamp(28px,6vw,48px)] font-extrabold text-[#FA3A2B] mb-4">
                                    ROBERT<br />BALTAZAR TRIO
                                </h2>
                                <p className="text-gray-300 mb-6 leading-relaxed">
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry...
                                </p>
                                <PrimaryButton to="/eventselect" className="px-8 py-3">VIEW</PrimaryButton>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Events Section */}
                <section id="events-section" className="py-12 px-6">
                    <div className="max-w-7xl mx-auto">
                        <h2 className="text-center text-[clamp(28px,6vw,80px)] font-extrabold text-black pb-8 pt-20 leading-tight">
                            <span className="text-[#FA3A2B]">ALL</span> VIBE LONG <span className="text-[#FA3A2B]">STAGE</span> ON FIRE
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

                        {/* สถานะโหลด / error */}
                        {loading && (
                            <div className="text-center text-gray-500 py-10">กำลังโหลดรายการอีเวนต์...</div>
                        )}
                        {err && (
                            <div className="text-center text-red-600 py-10">โหลดล้มเหลว: {err}</div>
                        )}

                        {/* Summary filter */}
                        {!loading && !err && (debouncedSearchQuery.trim() || eventFilter !== "All") && (
                            <div className="mb-6 text-center">
                                <p className="text-gray-600">
                                    {filteredEvents.length > 0
                                        ? `Found ${filteredEvents.length} event${filteredEvents.length > 1 ? "s" : ""}`
                                        : "No events found"}
                                    {debouncedSearchQuery.trim() && (
                                        <span> for "<strong>{debouncedSearchQuery}</strong>"</span>
                                    )}
                                    {eventFilter !== "All" && <span> in <strong>{eventFilter}</strong> category</span>}
                                </p>
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
                                            onClick={() => navigate(`/eventdetail/${event.id}`)}
                                        />
                                    ))
                                ) : (
                                    <div className="col-span-full text-center py-12">
                                        <div className="text-gray-400 mb-4">
                                            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
                                        <p className="text-gray-500 mb-4">
                                            Try adjusting your search terms or filters to find more events.
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
                                    <OutlineButton onClick={() => setVisibleCount((n) => Math.min(n + LOAD_STEP, filteredEvents.length))}>
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
