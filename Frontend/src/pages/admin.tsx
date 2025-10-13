"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import EventToolbar from "@/components/EventToolbar";
import { Badge } from "@/components/badge";

// ---------- Static image imports ----------
import poster1 from "@/assets/poster.png";
import poster2 from "@/assets/poster2.png";
import poster3 from "@/assets/poster3.png";
import poster4 from "@/assets/poster4.png";
import poster5 from "@/assets/poster5.png";
import poster6 from "@/assets/poster6.png";
import poster7 from "@/assets/poster7.png";
import poster8 from "@/assets/poster8.png";

// ---------- Types ----------
type ModerationStatus = "ON SALE" | "OFF SALE";
type Order = "newest" | "oldest";

type Event = {
  id: string;
  cover: string;                 // URL produced by bundler from static import
  eventName: string;
  organizer: string;
  startSaleDate: string;         // ISO
  endSaleDate: string;           // ISO
  location: string;
  status: ModerationStatus;
  category: string;
  date: string;                  // ISO (show date)
  saleSeat?: string;             // e.g. "1,250 / 5,000"
};

// ---------- Poster data (optional export) ----------
type Poster = { dateLabel: string; title: string; imageUrl: string };
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

// ---------- Mock events (ใช้รูปจาก static imports) ----------
const mockEvents: Event[] = [
  {
    id: "evt_1",
    cover: posters[4],
    eventName: "ROBERT BALTAZAR TRIO",
    organizer: "Butcon Organizer",
    startSaleDate: "2025-09-25T03:00:00.000Z",
    endSaleDate:   "2025-12-01T14:59:59.000Z",
    location: "MCC HALL, The Mall Bangkapi",
    status: "ON SALE",
    category: "concert",
    date: "2025-12-15T19:30:00.000Z",
    saleSeat: "2,450 / 5,000",
  },
  {
    id: "evt_2",
    cover: posters[2],
    eventName: "THE RIVER BROS",
    organizer: "Thai Ticket",
    startSaleDate: "2025-09-10T03:00:00.000Z",
    endSaleDate:   "2025-10-30T14:59:59.000Z",
    location: "Paragon Hall",
    status: "ON SALE",
    category: "concert",
    date: "2025-11-20T20:00:00.000Z",
    saleSeat: "3,100 / 3,500",
  },
  {
    id: "evt_3",
    cover: posters[1],
    eventName: "MIDNIGHT RAVE PARTY",
    organizer: "Event Master",
    startSaleDate: "2025-08-20T03:00:00.000Z",
    endSaleDate:   "2025-09-25T14:59:59.000Z",
    location: "IMPACT ARENA",
    status: "OFF SALE",
    category: "festival",
    date: "2025-10-05T23:00:00.000Z",
    saleSeat: "5,000 / 5,000",
  },
  {
    id: "evt_4",
    cover: posters[7],
    eventName: "IN RIVER DANCE",
    organizer: "Dance Studio",
    startSaleDate: "2025-09-05T03:00:00.000Z",
    endSaleDate:   "2025-10-15T14:59:59.000Z",
    location: "Theater Hall",
    status: "ON SALE",
    category: "performance",
    date: "2025-11-02T19:00:00.000Z",
    saleSeat: "1,250 / 5,000",
  },
  {
    id: "evt_5",
    cover: posters[3],
    eventName: "THE ART HOUSE 4",
    organizer: "Creative Space",
    startSaleDate: "2025-09-12T03:00:00.000Z",
    endSaleDate:   "2025-10-31T14:59:59.000Z",
    location: "Art Center",
    status: "ON SALE",
    category: "exhibition",
    date: "2025-12-10T10:00:00.000Z",
    saleSeat: "900 / 1,500",
  },
  {
    id: "evt_6",
    cover: posters[5],
    eventName: "SOMBR UNDRESS",
    organizer: "Thai Ticket",
    startSaleDate: "2025-07-01T03:00:00.000Z",
    endSaleDate:   "2025-09-01T14:59:59.000Z",
    location: "Zombie",
    status: "OFF SALE",
    category: "concert",
    date: "2025-09-28T21:00:00.000Z",
    saleSeat: "3,500 / 3,500",
  },
  {
    id: "evt_7",
    cover: posters[0],
    eventName: "THE SHAPE OF THINGS",
    organizer: "Art Collective",
    startSaleDate: "2025-09-18T03:00:00.000Z",
    endSaleDate:   "2025-12-31T14:59:59.000Z",
    location: "Gallery One",
    status: "ON SALE",
    category: "exhibition",
    date: "2026-01-15T14:00:00.000Z",
    saleSeat: "320 / 1,200",
  },
  {
    id: "evt_8",
    cover: posters[6],
    eventName: "DATA & DESIGN SEMINAR",
    organizer: "Mahidol ICT",
    startSaleDate: "2025-09-22T03:00:00.000Z",
    endSaleDate:   "2025-11-15T14:59:59.000Z",
    location: "MU Lecture Hall",
    status: "ON SALE",
    category: "seminar",
    date: "2025-11-30T09:00:00.000Z",
    saleSeat: "1,050 / 1,200",
  },
];

// ---------- Helpers ----------
const fmtDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(iso));

const fmtDateTime = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));

function useDebounced<T>(value: T, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return v;
}

async function fetchEvents(): Promise<Event[]> {
  return Promise.resolve(mockEvents);
}

// สี badge (แก้ที่นี่จุดเดียว)
function statusBadgeClass(status: ModerationStatus) {
  return status === "ON SALE"
    ? "bg-emerald-100 text-emerald-800 whitespace-nowrap"
    : "bg-zinc-200 text-zinc-800 whitespace-nowrap";
}


// ---------- Page ----------
export default function EventPermissionPage() {
  const navigate = useNavigate();

  // filters
  const [statusFilter, setStatusFilter] = useState<"all" | ModerationStatus>("all");
  const [order, setOrder] = useState<Order>("newest");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 300);

  // data
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchEvents();
      setEvents(data);
      setLoading(false);
    })();
  }, []);

  useEffect(() => { setPage(1); }, [statusFilter, debouncedSearch, order]);

  const categoryOptions = [
    { label: "Show all", value: "all" },
    { label: "ON SALE", value: "ON SALE" },
    { label: "OFF SALE", value: "OFF SALE" },
  ];

  const filtered = useMemo(() => {
    let list = events;

    if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.eventName.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q)
      );
    }

    // sort by show date
    list = [...list].sort((a, b) => {
      const da = +new Date(a.date);
      const db = +new Date(b.date);
      return order === "newest" ? db - da : da - db;
    });

    return list;
  }, [events, statusFilter, debouncedSearch, order]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />

      <div className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          {/* Header (ให้ dropdown อยู่บนสุด) */}
          <div className="mb-6 flex items-center justify-between gap-4 relative">
            <h1 className="text-3xl font-bold text-gray-900">Event Management</h1>
            <div className="relative">
              <EventToolbar
                categories={categoryOptions}
                category={statusFilter}
                onCategoryChange={(v) => setStatusFilter(v as "all" | ModerationStatus)}
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

          {/* Table (overflow-x-auto ป้องกัน dropdown โดนคลิป) */}
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
                    <td colSpan={8} className="px-6 py-14 text-center text-sm text-gray-600">ไม่พบอีเวนต์ที่ตรงกับเงื่อนไข</td>
                  </tr>
                ) : (
                  pageItems.map((event) => (
                    <tr
                      key={event.id}
                      className="cursor-pointer transition-colors hover:bg-gray-50"
                      onClick={() => navigate(`/admin/eventdetail?id=${event.id}`)}
                    >
                      <td className="px-6 py-4">
                        <img
                          src={event.cover}
                          alt={event.eventName}
                          className="h-16 w-12 rounded object-cover"
                          draggable={false}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{event.eventName}</div>
                        <div className="text-xs text-gray-500">({event.category})</div>
                      </td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{event.organizer}</div></td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{fmtDateTime(event.date)}</div></td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{fmtDate(event.startSaleDate)} → {fmtDate(event.endSaleDate)}</div></td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{event.location}</div></td>
                      <td className="px-6 py-4">
                        <Badge className={statusBadgeClass(event.status)}>{event.status}</Badge>
                      </td>
                      <td className="px-6 py-4"><div className="text-sm text-gray-900">{event.saleSeat ?? "—"}</div></td>
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
                  className={`rounded-md border px-3 py-1.5 text-sm ${page === i + 1 ? "bg-gray-900 text-white" : "hover:bg-gray-50"}`}
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
