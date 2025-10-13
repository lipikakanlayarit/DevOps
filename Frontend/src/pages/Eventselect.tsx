"use client";

import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import type { EventDTO } from "@/types";

// ===== Fallback poster =====
import posterFallback from "@/assets/poster.png";

// ===== Seating types (ตาม API /api/events/:id/seating) =====
type SeatDTO = { seatId: number; label: string; number: number; available: boolean };
type RowDTO  = { rowId: number; label: string; seats: SeatDTO[] };
type ZoneDTO = { zoneId: number; zoneName: string; price: number | string | null; rows: RowDTO[] };
type SeatingResp = { eventId: number; zones: ZoneDTO[] };

// ===== UI seat pick for your summary card(s) =====
type SeatPick = { row: string; seat: number; zone: string; price: number; seatId: number };

export default function Eventselect() {
  // ===== 1) Load event detail by :id =====
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // seating จาก DB
  const [seating, setSeating] = useState<SeatingResp | null>(null);
  const [seatingError, setSeatingError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [evRes, seatRes] = await Promise.all([
          api.get<EventDTO>(`/api/events/${id}`),
          api.get<SeatingResp>(`/api/events/${id}/seating`),
        ]);
        if (!alive) return;
        setEvent(evRes.data);
        setSeating(seatRes.data);
        setLoadError(null);
        setSeatingError(null);
      } catch (e: any) {
        if (!alive) return;
        // แยก error event / seating เท่าที่ทำได้
        setLoadError(e?.response?.data?.message || e?.message || "Failed to load");
        setSeatingError(e?.response?.data?.error || e?.message || "Failed to load seating");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  // ===== 2) UI states =====
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatPick[]>([]);

  // ===== 3) Utils =====
  const fmtDate = (iso?: string, opts?: Intl.DateTimeFormatOptions) =>
    iso
      ? new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
          ...opts,
        }).format(new Date(iso))
      : "";

  // แปลงให้ได้ “6 A.M.” / “5 P.M.”
  const formatBadgeTime = (iso?: string) => {
    if (!iso) return "";
    const parts = new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      hour12: true,
    }).formatToParts(new Date(iso));
    const hour = parts.find((p) => p.type === "hour")?.value ?? "";
    const dpRaw = (parts.find((p) => p.type === "dayPeriod")?.value || "").toUpperCase();
    const dp = dpRaw === "AM" ? "A.M." : dpRaw === "PM" ? "P.M." : dpRaw;
    return `${hour} ${dp}`.trim();
  };

  const fmtShortBadge = (iso?: string) =>
    iso
      ? {
          dowShort: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(iso)),
          day2: new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(new Date(iso)),
          monShort: new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(iso)),
          timeLabel: formatBadgeTime(iso),
        }
      : null;

  // ===== Date cards: ใช้ startAt / endAt ของ event =====
  const dateCards = useMemo(() => {
    const list: Array<{
      key: string;
      iso: string;
      title: string;
      venueLine1: string;
      venueLine2: string;
      poster: string;
    }> = [];

    if (!event?.startAt) return list;

    const venue = event.location || "";
    const title = event.title || "Untitled Event";
    const poster = event.imageUrl || posterFallback;

    const start = new Date(event.startAt);
    const end = event.endAt ? new Date(event.endAt) : null;

    const sameDay =
      end &&
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    list.push({ key: "start", iso: event.startAt, title, venueLine1: venue, venueLine2: "", poster });

    if (end && !sameDay) {
      list.push({ key: "end", iso: event.endAt!, title, venueLine1: venue, venueLine2: "", poster });
    }

    return list;
  }, [event]);

  const scrollToDateSelection = () => {
    const el = document.getElementById("date-selection");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // ===== 4) Seat map จาก DB (แทน mock) =====
  // helper: หาโซน/ราคา/แถว/ที่นั่งจาก seatId
  const zoneByRowId = useMemo(() => {
    const map = new Map<number, ZoneDTO>();
    seating?.zones.forEach((z) => z.rows.forEach((r) => map.set(r.rowId, z)));
    return map;
  }, [seating]);

  const rowById = useMemo(() => {
    const map = new Map<number, RowDTO>();
    seating?.zones.forEach((z) => z.rows.forEach((r) => map.set(r.rowId, r)));
    return map;
  }, [seating]);

  const seatIndex: Map<number, { row: RowDTO; zone: ZoneDTO; seat: SeatDTO }> = useMemo(() => {
    const map = new Map<number, { row: RowDTO; zone: ZoneDTO; seat: SeatDTO }>();
    seating?.zones.forEach((z) =>
      z.rows.forEach((r) =>
        r.seats.forEach((s) => map.set(s.seatId, { row: r, zone: z, seat: s }))
      )
    );
    return map;
  }, [seating]);

  const onClickSeat = (s: SeatDTO, r: RowDTO, z: ZoneDTO) => {
    if (!s.available) return;
    const price = Number(z.price || 0);
    const pick: SeatPick = { row: r.label, seat: s.number, zone: z.zoneName, price, seatId: s.seatId };
    setSelectedSeats((prev) => {
      const i = prev.findIndex((x) => x.seatId === s.seatId);
      if (i >= 0) return prev.filter((_, idx) => idx !== i);
      return [...prev, pick];
    });
  };

  useEffect(() => {
    if (selectedDateKey) {
      const el = document.getElementById("seat-map-section");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [selectedDateKey]);

  const handleDateClick = (key: string) => {
    setSelectedSeats([]); // reset เมื่อเปลี่ยนรอบ
    setSelectedDateKey((prev) => (prev === key ? null : key));
  };

  const isSeatSelected = (seatId: number) => selectedSeats.some((s) => s.seatId === seatId);
  const getTotalPrice = () => selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const generateReserveId = () => Math.random().toString().slice(2, 17).padStart(15, "0");

  // ===== 5) Confirm booking → POST /api/events/:id/confirm =====
  const confirmBooking = async () => {
    if (!id || selectedSeats.length === 0) return;
    try {
      const seatIds = selectedSeats.map((s) => s.seatId);
      await api.post(`/api/events/${id}/confirm`, { seatIds });
      alert("Successfully booked ticket");
      navigate("/profile");
    } catch (e: any) {
      const msg = e?.response?.data?.error || e?.message || "Booking failed";
      alert(msg);
    }
  };

  // ===== 6) Loading / Error =====
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-200 bg-black">
        กำลังโหลดข้อมูลอีเวนต์…
      </div>
    );
  }
  if (loadError || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-300 bg-black">
        ไม่สามารถโหลดอีเวนต์ได้: {loadError || "Unknown error"}
      </div>
    );
  }

  const headerPoster = event.imageUrl || posterFallback;
  const saleOpen = fmtDate(event.startAt, {});

  // คำนวณ “ราคาที่ใช้โชว์” ตรง Ticket Prices (สรุปจากโซนจริง)
  const priceStrings =
    seating?.zones?.length
      ? Array.from(
          new Set(
            seating.zones
              .map((z) => Number(z.price || 0))
              .filter((n) => !isNaN(n) && n > 0)
              .sort((a, b) => a - b)
              .map((n) => `฿ ${n.toLocaleString()}`)
          )
        ).join(" / ")
      : "฿ 500 / ฿ 600 / ฿ 800 / ฿ 1,500 / ฿ 3,500 / ฿ 3,000 / ฿ 2,000 / ฿ 1,500";

  return (
    <div className="min-h-screen text-white" style={{ background: "var(--black, #000000)" }}>
      {/* ========== Hero Section (คงหน้าตาเดิม) ========== */}
      <section className="relative px-6 py-16" style={{ background: "var(--black, #1D1D1D)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Poster */}
            <div className="relative">
              <img
                src={headerPoster}
                alt={event.title || "Event Poster"}
                className="w-full max-w-md mx-auto rounded-lg shadow-2xl object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = posterFallback;
                }}
              />
            </div>

            {/* Details */}
            <div className="space-y-6">
              <div className="text-sm" style={{ color: "var(--gray-1, #C3C3C3)" }}>
                {event.startAt
                  ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(event.startAt))
                  : ""}
              </div>

              <h1
                className="text-4xl lg:text-6xl font-bold leading-tight break-words"
                style={{ color: "var(--red, #FA3A2B)", fontFamily: '"Roboto Flex", sans-serif', fontWeight: 800 }}
              >
                {event.title || "Untitled Event"}
              </h1>

              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Show Date
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                      {event.startAt ? fmtDate(event.startAt) : "-"}
                    </div>
                    {event.endAt && <div style={{ color: "var(--gray-1, #C3C3C3)" }}>{fmtDate(event.endAt)}</div>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Sale Opening Date
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                      {saleOpen || "-"}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      {event.location || "-"}
                    </div>
                    {event.description && <div style={{ color: "var(--gray-1, #C3C3C3)" }}>{event.description}</div>}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Ticket Prices
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                      {priceStrings}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={scrollToDateSelection}
                  className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "var(--red, #FA3A2B)",
                    color: "var(--white, #FFFFFF)",
                    border: "none",
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Get Ticket
                </button>
                <button
                  onClick={() => setShowDetails((s) => !s)}
                  className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                  style={{
                    background: "var(--near-black-2, #1A1919)",
                    color: "var(--white, #FFFFFF)",
                    border: `1px solid var(--gray-1, #C3C3C3)`,
                    borderRadius: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {showDetails ? "Hide Detail" : "View Detail"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Section */}
      {showDetails && (
        <section className="px-6 py-8" style={{ background: "#DBDBDB" }}>
          <div className="max-w-4xl mx-auto">
            <p
              className="text-center leading-relaxed"
              style={{
                color: "#000000",
                fontFamily: '"Roboto Flex", sans-serif',
                fontSize: 16,
                lineHeight: "1.6",
                textAlign: "justify",
                marginBottom: 32,
              }}
            >
              {event.description || "No additional description provided for this event."}
            </p>
          </div>
        </section>
      )}

      {/* ========== Date Cards + Seat Map (จาก DB) ========== */}
      <section id="date-selection" className="px-6 py-8" style={{ background: "#DBDBDB" }}>
        <div className="max-w-4xl mx-auto space-y-6">
          {dateCards.map((c) => {
            const b = fmtShortBadge(c.iso);
            const active = selectedDateKey === c.key;
            return (
              <div
                key={c.key}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                style={{
                  background: active ? "var(--red, #FA3A2B)" : "var(--white, #FFFFFF)",
                  borderRadius: "var(--card-radius, 8px)",
                  boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                }}
                onClick={() => handleDateClick(c.key)}
              >
                <div className="flex">
                  <div
                    className="p-6 flex flex-col items-center justify-center min-w-[120px]"
                    style={{
                      background: "var(--near-black-3, #1D1D1D)",
                      color: "var(--white, #FFFFFF)",
                    }}
                  >
                    <div className="text-sm">{b?.dowShort || ""}</div>
                    <div className="text-3xl font-bold">{b?.day2 || ""}</div>
                    <div className="text-sm">{b?.monShort || ""}</div>
                    <div className="text-xs mt-2 px-2 py-1 rounded" style={{ background: "var(--black, #000000)" }}>
                      {b?.timeLabel || ""}
                    </div>
                  </div>
                  <div className="flex-1 p-6 flex items-center justify-between">
                    <div>
                      <h3
                        className="text-2xl font-bold mb-2 break-words"
                        style={{
                          color: active ? "var(--white, #FFFFFF)" : "var(--red, #FA3A2B)",
                          fontFamily: '"Roboto Flex", sans-serif',
                          fontWeight: 800,
                        }}
                      >
                        {c.title}
                      </h3>
                      <div
                        className="flex items-center gap-2"
                        style={{ color: active ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)" }}
                      >
                        <MapPin className="w-4 h-4" />
                        <span>{c.venueLine1 || "-"}</span>
                      </div>
                      {c.venueLine2 && (
                        <div style={{ color: active ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)" }}>
                          {c.venueLine2}
                        </div>
                      )}
                    </div>
                    <div
                      className="w-24 h-24 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                      style={{ background: "var(--gray-1, #C3C3C3)" }}
                    >
                      <img
                        src={c.poster}
                        alt={c.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = posterFallback;
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Seat map จาก DB */}
          {selectedDateKey && (
            <div id="seat-map-section" className="mt-8 space-y-6">
              <div
                className="p-8"
                style={{
                  background: "var(--white, #FFFFFF)",
                  borderRadius: "var(--card-radius, 8px)",
                  boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                }}
              >
                {!seating ? (
                  <div className="text-center text-red-600">{seatingError || "No seating found."}</div>
                ) : seating.zones.length === 0 ? (
                  <div className="text-center text-gray-600">No seating layout for this event.</div>
                ) : (
                  <div className="space-y-6">
                    {/* Stage */}
                    <div
                      className="w-full h-12 flex items-center justify-center text-white font-bold text-lg mb-8 mx-auto max-w-2xl"
                      style={{ background: "var(--near-black-3, #1D1D1D)", borderRadius: "8px" }}
                    >
                      STAGE
                    </div>

                    {/* Zones -> Rows -> Seats */}
                    {seating.zones.map((z) => (
                      <div key={z.zoneId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold text-black">{z.zoneName}</div>
                          <div className="text-sm text-zinc-600">
                            {z.price ? `฿${Number(z.price).toLocaleString()}` : "-"}
                          </div>
                        </div>

                        <div className="space-y-1 max-w-4xl mx-auto">
                          {z.rows.map((r) => (
                            <div key={r.rowId} className="flex items-center justify-center gap-1">
                              <div className="w-8 text-center font-bold text-gray-700 text-sm">{r.label}</div>
                              <div className="flex gap-1 flex-wrap">
                                {r.seats.map((s) => {
                                  const selected = isSeatSelected(s.seatId);
                                  const occupied = !s.available;
                                  return (
                                    <button
                                      key={s.seatId}
                                      onClick={() => onClickSeat(s, r, z)}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${
                                        !occupied ? "hover:scale-110" : ""
                                      }`}
                                      style={{
                                        background: selected
                                          ? "var(--red, #FA3A2B)"
                                          : occupied
                                          ? "#2D2D2D"
                                          : "#F4D03F",
                                        color: selected ? "white" : occupied ? "#4CAF50" : "#2D2D2D",
                                        border: `2px solid ${occupied ? "#2D2D2D" : "#E0E0E0"}`,
                                        cursor: occupied ? "not-allowed" : "pointer",
                                        fontSize: "10px",
                                        fontWeight: "bold",
                                      }}
                                      disabled={occupied}
                                      title={
                                        occupied
                                          ? `${s.label} (Occupied)`
                                          : `${s.label} (${z.zoneName})`
                                      }
                                    >
                                      {occupied ? "✕" : s.number}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="w-8 text-center font-bold text-gray-700 text-sm">{r.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-6 pt-4 border-t flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#F4D03F", color: "#2D2D2D", border: "2px solid #E0E0E0" }}>
                          1
                        </div>
                        <span className="text-sm text-gray-700">Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#2D2D2D", color: "#4CAF50", border: "2px solid #2D2D2D" }}>
                          ✕
                        </div>
                        <span className="text-sm text-gray-700">Occupied</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--red, #FA3A2B)", color: "white" }}>
                          1
                        </div>
                        <span className="text-sm text-gray-700">Selected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Summary & Confirm */}
              {selectedSeats.length > 0 && (
                <div className="flex justify-center">
                  <div
                    className="p-6 w-full max-w-4xl"
                    style={{
                      background: "var(--white, #FFFFFF)",
                      borderRadius: "var(--card-radius, 8px)",
                      boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                      border: "2px solid var(--red, #FA3A2B)",
                    }}
                  >
                    {selectedSeats.length === 1 ? (
                      // Single ticket
                      <div className="flex items-start gap-4">
                        <div className="w-20 h-20 flex-shrink-0">
                          <img
                            src={headerPoster}
                            alt={event.title || "Event Poster"}
                            className="w-full h-full object-cover rounded-lg shadow"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = posterFallback;
                            }}
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                              Reserve ID
                            </div>
                            <div className="text-lg font-mono" style={{ color: "var(--near-black-1, #100F0F)" }}>
                              {generateReserveId()}
                            </div>
                          </div>

                          <div>
                            <div className="text-lg font-bold" style={{ color: "var(--near-black-1, #100F0F)" }}>
                              {event.title}
                            </div>
                            <div className="flex items-center gap-1 text-sm" style={{ color: "var(--gray-1, #666)" }}>
                              <MapPin className="w-3 h-3" />
                              <span>{event.location || "-"}</span>
                            </div>
                            <div className="text-sm" style={{ color: "var(--gray-1, #666)" }}>
                              {fmtDate(dateCards.find((d) => d.key === selectedDateKey)?.iso)}
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>ZONE</div>
                              <div className="font-bold text-lg" style={{ color: "var(--red, #FA3A2B)" }}>
                                {selectedSeats[0].zone}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>ROW</div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                {selectedSeats[0].row}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>SEAT</div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                {selectedSeats[0].seat}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>PRICE</div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                ฿{selectedSeats[0].price.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={confirmBooking}
                            className="w-full mt-4 px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                            style={{
                              background: "var(--red, #FA3A2B)",
                              color: "var(--white, #FFFFFF)",
                              border: "none",
                              borderRadius: "25px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Confirm
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Multiple tickets
                      <div className="space-y-6">
                        <div className="text-center border-b pb-4">
                          <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                            Multiple Tickets Reserved
                          </div>
                          <div className="text-2xl font-bold mt-2" style={{ color: "var(--near-black-1, #100F0F)" }}>
                            {event.title}
                          </div>
                          <div className="flex items-center justify-center gap-1 text-sm mt-1" style={{ color: "var(--gray-1, #666)" }}>
                            <Calendar className="w-3 h-3" />
                            <span>{fmtDate(dateCards.find((d) => d.key === selectedDateKey)?.iso)}</span>
                          </div>
                        </div>

                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                          {selectedSeats.map((seat, index) => (
                            <div key={seat.seatId} className="border rounded-lg p-4" style={{ borderColor: "var(--red, #FA3A2B)" }}>
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 flex-shrink-0">
                                  <img
                                    src={headerPoster}
                                    alt={event.title || "Event Poster"}
                                    className="w-full h-full object-cover rounded-lg shadow"
                                    onError={(e) => {
                                      (e.currentTarget as HTMLImageElement).src = posterFallback;
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="text-xs font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                                    Ticket #{index + 1}
                                  </div>
                                  <div className="text-sm font-mono" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                    {generateReserveId()}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>ZONE</div>
                                  <div className="font-bold text-sm" style={{ color: "var(--red, #FA3A2B)" }}>{seat.zone}</div>
                                </div>
                                <div>
                                  <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>SEAT</div>
                                  <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                    {seat.row}{seat.seat}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>PRICE</div>
                                  <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                    ฿{seat.price.toLocaleString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4">
                          <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-semibold" style={{ color: "var(--near-black-1, #100F0F)" }}>
                              Total ({selectedSeats.length} tickets):
                            </span>
                            <span className="text-2xl font-bold" style={{ color: "var(--red, #FA3A2B)" }}>
                              ฿{getTotalPrice().toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={confirmBooking}
                            className="w-full px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90"
                            style={{
                              background: "var(--red, #FA3A2B)",
                              color: "var(--white, #FFFFFF)",
                              border: "none",
                              borderRadius: "25px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Confirm - {selectedSeats.length} Tickets
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
