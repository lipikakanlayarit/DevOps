"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// data
import { useEvents } from "@/hooks/useEvents";
import type { EventDTO } from "@/types";

// ui
import PosterCard from "@/components/PosterCard";
import CategoryRadio from "@/components/CategoryRadio";
import PrimaryButton from "@/components/PrimaryButton";
import OutlineButton from "@/components/OutlineButton";
import EventCard from "@/components/EventCard";
import SearchBar from "@/components/SearchBar";
import Footer from "@/components/Footer";
import CountdownTimer from "@/components/CountdownTimer";

// assets (fallback)
import poster1 from "@/assets/poster.png";
import poster2 from "@/assets/poster2.png";
import poster3 from "@/assets/poster3.png";
import poster4 from "@/assets/poster4.png";
import poster5 from "@/assets/poster5.png";
import poster6 from "@/assets/poster6.png";
import poster7 from "@/assets/poster7.png";
import poster8 from "@/assets/poster8.png";

type PosterItem = { id?: number; dateLabel: string; title: string; imageUrl: string };

// fallback posters
const posters = [poster1, poster2, poster3, poster4, poster5, poster6, poster7, poster8];
const posterDataMock: PosterItem[] = [
  { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[0] },
  { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[1] },
  { dateLabel: "[2025.07.27]", title: "THE RIVER BROS", imageUrl: posters[2] },
  { dateLabel: "[2025.07.27]", title: "CREATIVE POSTER EXHIBITION", imageUrl: posters[3] },
  { dateLabel: "[2025.07.27]", title: "ROBERT BALTAZAR TRIO", imageUrl: posters[4] },
  { dateLabel: "[2025.07.27]", title: "VICTIM by ...", imageUrl: posters[5] },
  { dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE...", imageUrl: posters[6] },
  { dateLabel: "[2025.07.27]", title: "IN RIVER DANCE", imageUrl: posters[7] },
];

// utils
function useDebounced<T>(value: T, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debouncedValue;
}

function formatRangeISO(start?: string, end?: string) {
  if (!start) return "";
  const fmt = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const s = fmt.format(new Date(start));
  const e = end ? fmt.format(new Date(end)) : "";
  return e ? `${s} – ${e}` : s;
}

function mapEventToCard(e: EventDTO, idx: number) {
  const cover = e.imageUrl || posters[idx % posters.length];
  const dateRange = formatRangeISO(e.startAt, e.endAt);
  const title = e.title || "Untitled Event";
  const venue = e.location || "";
  const lower = `${title} ${venue} ${e.description || ""}`.toLowerCase();
  let category: "Concert" | "Seminar" | "Exhibition" | "Other" = "Other";
  if (/(concert|music|live|band|festival)/i.test(lower)) category = "Concert";
  else if (/(seminar|conference|talk|workshop|meetup)/i.test(lower)) category = "Seminar";
  else if (/(exhibit|gallery|art|showcase)/i.test(lower)) category = "Exhibition";
  return { cover, dateRange, title, venue, category, id: e.id };
}

export default function Landding() {
  const navigate = useNavigate();

  // search/filter
  const [searchQuery, setSearchQuery] = useState("");
  const [eventFilter, setEventFilter] =
    useState<"All" | "Concert" | "Seminar" | "Exhibition" | "Other">("All");
  const debouncedSearch = useDebounced(searchQuery, 300);

  // list sizing
  const INITIAL_COUNT = 5;
  const LOAD_STEP = 5;
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  useEffect(() => setVisibleCount(INITIAL_COUNT), [eventFilter, debouncedSearch]);

  // fetch events
  const { data, loading, error } = useEvents({
    page: 0,
    size: 200,
    q: debouncedSearch.trim() || undefined,
  });
  const allEvents: EventDTO[] = data?.content ?? [];

  // upcoming (1 ปี) สำหรับแถบด้านบน
  const now = new Date();
  const in1Year = new Date(now);
  in1Year.setFullYear(now.getFullYear() + 1);

  const upcomingWithin1Year = useMemo(
    () =>
      allEvents
        .filter((e) => e.startAt && new Date(e.startAt) >= now && new Date(e.startAt) <= in1Year)
        .sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime()),
    [allEvents]
  );

  const postersFromDB: PosterItem[] =
    upcomingWithin1Year.length > 0
      ? upcomingWithin1Year.map((e, idx) => ({
          id: e.id,
          dateLabel: `[${new Intl.DateTimeFormat(undefined, {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(e.startAt!))}]`,
          title: e.title || "Untitled Event",
          imageUrl: e.imageUrl || posters[idx % posters.length],
        }))
      : posterDataMock;

  // featured (nearest future)
  const nearestEvent = useMemo(() => {
    const future = allEvents.filter((e) => e.startAt && new Date(e.startAt) > now);
    future.sort((a, b) => new Date(a.startAt!).getTime() - new Date(b.startAt!).getTime());
    return future[0] ?? null;
  }, [allEvents]);

  // countdown target sync กับ featured
  const countdownTarget: Date = useMemo(() => {
    if (nearestEvent?.startAt) return new Date(nearestEvent.startAt);
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 10);
    fallback.setHours(12, 56, 25, 0);
    return fallback;
  }, [nearestEvent]);

  // grid cards (ALL EVENTS)
  const cards = useMemo(() => allEvents.map(mapEventToCard), [allEvents]);
  const filteredCards = useMemo(() => {
    if (eventFilter === "All") return cards;
    return cards.filter((c) => c.category === eventFilter);
  }, [cards, eventFilter]);

  // scroll to list
  const scrollToEventsSection = () => {
    const el = document.getElementById("events-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // =========================
  // Carousel: auto-scroll + drag (แก้ให้ลากได้ลื่น)
  // =========================
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [didDrag, setDidDrag] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, left: 0 });
  const [autoPlay, setAutoPlay] = useState(true);
  const rafRef = useRef<number | null>(null);

  const DRAG_THRESHOLD = 5;

  // auto-scroll via rAF
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const speed = 0.5; // px per frame
    const half = () => el.scrollWidth / 2;

    const loop = () => {
      if (autoPlay && !isPointerDown) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= half()) el.scrollLeft -= half();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [autoPlay, isPointerDown]);

  // ensure we start at some offset so both halves exist visually
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth / 4;
    });
    return () => cancelAnimationFrame(id);
  }, [postersFromDB.length]);

  // drag handlers (mouse)
  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    setIsPointerDown(true);
    setDidDrag(false);
    setAutoPlay(false);
    setDragStart({ x: e.pageX, left: el.scrollLeft });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const el = scrollerRef.current;
    if (!isPointerDown || !el) return;
    const dx = e.pageX - dragStart.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) setDidDrag(true);
    e.preventDefault(); // สำคัญ: กันการ select/text-drag
    el.scrollLeft = dragStart.left - dx;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    if (el.scrollLeft < 0) el.scrollLeft += half;
  };
  const endPointer = () => {
    setIsPointerDown(false);
    setTimeout(() => setAutoPlay(true), 300);
    // ไม่รีเซ็ต didDrag ตรงนี้ เพื่อให้ onClick เช็คได้ในเฟรมถัดไป
    setTimeout(() => setDidDrag(false), 0);
  };

  // touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    const x = e.touches[0].clientX;
    setIsPointerDown(true);
    setDidDrag(false);
    setAutoPlay(false);
    setDragStart({ x, left: el.scrollLeft });
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const el = scrollerRef.current;
    if (!isPointerDown || !el) return;
    const x = e.touches[0].clientX;
    const dx = x - dragStart.x;
    if (Math.abs(dx) > DRAG_THRESHOLD) setDidDrag(true);
    e.preventDefault(); // กันการ scroll แนวตั้ง/behavior อื่น
    el.scrollLeft = dragStart.left - dx;
    const half = el.scrollWidth / 2;
    if (el.scrollLeft >= half) el.scrollLeft -= half;
    if (el.scrollLeft < 0) el.scrollLeft += half;
  };

  // featured view data
  const featuredPoster = nearestEvent?.imageUrl || poster1;
  const featuredDateText = nearestEvent?.startAt
    ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(
        new Date(nearestEvent.startAt)
      )
    : "—";
  const featuredTitle = nearestEvent?.title || "ROBERT\nBALTAZAR TRIO";
  const featuredDesc =
    nearestEvent?.description ||
    "Lorem Ipsum is simply dummy text of the printing and typesetting industry…";

  return (
    <>
      <style>{`
        .poster-container { padding: 15px 10px; user-select: none; }
        .drag-scroll {
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          cursor: grab;
        }
        .drag-scroll::-webkit-scrollbar { display: none; }
        .drag-scroll:active { cursor: grabbing; }
      `}</style>

      <div className="min-h-screen bg-[#DBDBDB]">
        {/* HERO + CAROUSEL */}
        <section className="px-6 py-16">
          <div className="text-center mb-5">
            <h1 className="text-[min(9vw,200px)] font-extrabold leading-tight">LIVE THE VIBE ON</h1>
            <div className="flex justify-center gap-4 mb-12 pt-8">
              <PrimaryButton onClick={scrollToEventsSection} className="px-8 py-3">
                ALL EVENT
              </PrimaryButton>
              <OutlineButton className="px-8 py-3" to="/OrganizerLogin">
                ORGANIZER
              </OutlineButton>
            </div>
          </div>

          <div className="relative py-5">
            <div
              ref={scrollerRef}
              className="drag-scroll"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={endPointer}
              onMouseLeave={endPointer}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={endPointer}
            >
              {/* duplicate 2 ชุดเพื่อทำอินฟินิตสกอลล์ */}
              <div className="flex gap-4 w-max">
                {[...postersFromDB, ...postersFromDB].map((p, i) => (
                  <div key={`poster-${i}`} className="flex-shrink-0 poster-container">
                    <div className="transition-transform duration-300 hover:scale-105 will-change-transform">
                      <PosterCard
                        dateLabel={p.dateLabel}
                        title={p.title}
                        imageUrl={p.imageUrl}
                        onClick={() => {
                          // กันคลิกตอนลากจริง ๆ เท่านั้น (ถ้าแค่แตะ/คลิกสั้น ๆ ให้คลิกทำงานปกติ)
                          if (didDrag) return;
                          if (p.id != null) navigate(`/eventselect/${p.id}`);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {loading && <div className="text-center text-gray-600 pt-2">กำลังโหลดอีเวนต์…</div>}
            {error && <div className="text-center text-red-600 pt-2">โหลดอีเวนต์ล้มเหลว</div>}
          </div>
        </section>

        {/* COUNTDOWN (ซิงก์กับ featured) */}
        <CountdownTimer targetDate={countdownTarget} />

        {/* FEATURED */}
        <section className="bg-[#1D1D1D] text-white py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <img
                  src={featuredPoster}
                  alt={featuredTitle}
                  className="w-full max-w-md mx-auto rounded-lg object-cover"
                />
              </div>
              <div>
                <div className="text-[clamp(16px,3vw,20px)] font-bold text-white mb-2">
                  {featuredDateText}
                </div>
                <h2 className="text-[clamp(28px,6vw,48px)] font-extrabold text-[#FA3A2B] mb-4 whitespace-pre-line">
                  {featuredTitle}
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed line-clamp-4">{featuredDesc}</p>
                {nearestEvent ? (
                  <PrimaryButton to={`/eventselect/${nearestEvent.id}`} className="px-8 py-3">
                    VIEW
                  </PrimaryButton>
                ) : (
                  <OutlineButton className="px-8 py-3" onClick={scrollToEventsSection}>
                    BROWSE EVENTS
                  </OutlineButton>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ALL EVENTS */}
        <section id="events-section" className="py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-center text-[clamp(28px,6vw,80px)] font-extrabold text-black pb-8 pt-20 leading-tight">
              <span className="text-[#FA3A2B]">ALL</span> VIBE LONG{" "}
              <span className="text-[#FA3A2B]">STAGE</span> ON FIRE
            </h2>

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
                  options={[
                    { label: "All", value: "All" },
                    { label: "Concert", value: "Concert" },
                    { label: "Seminar", value: "Seminar" },
                    { label: "Exhibition", value: "Exhibition" },
                  ]}
                  value={eventFilter}
                  onChange={(v: any) => setEventFilter(v)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 justify-items-center">
              {filteredCards.slice(0, visibleCount).map((ev, index) => (
                <EventCard
                  key={`${ev.title}-${index}`}
                  cover={ev.cover}
                  dateRange={ev.dateRange}
                  title={ev.title}
                  venue={ev.venue}
                  onClick={() => {
                    const match =
                      allEvents.find(
                        (e) =>
                          e.title === ev.title &&
                          formatRangeISO(e.startAt, e.endAt) === ev.dateRange
                      ) || allEvents.find((e) => e.title === ev.title);
                    if (match?.id != null) navigate(`/eventselect/${match.id}`);
                  }}
                />
              ))}
            </div>

            {filteredCards.length > 0 && (
              <div className="text-center mt-12">
                {visibleCount < filteredCards.length ? (
                  <OutlineButton
                    onClick={() => setVisibleCount((n) => Math.min(n + LOAD_STEP, filteredCards.length))}
                  >
                    Show more ({filteredCards.length - visibleCount} remaining)
                  </OutlineButton>
                ) : filteredCards.length > INITIAL_COUNT ? (
                  <OutlineButton onClick={() => setVisibleCount(INITIAL_COUNT)}>Show less</OutlineButton>
                ) : null}
              </div>
            )}

            {loading && <div className="text-center text-gray-600 py-6">กำลังโหลด…</div>}
            {error && <div className="text-center text-red-600 py-6">เกิดข้อผิดพลาดในการดึงข้อมูล</div>}
            {!loading && !error && filteredCards.length === 0 && (
              <div className="text-center text-gray-600 py-6">No events found</div>
            )}
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}
