"use client";

import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { api } from "@/lib/api";
import type { EventDTO } from "@/types";

// รูป fallback ถ้า event.imageUrl ไม่มี
import posterFallback from "@/assets/poster.png";

type SeatPick = { row: string; seat: number; zone: string; price: number };

export default function Eventselect() {
  // ===== 1) โหลดข้อมูลอีเวนต์ตาม :id =====
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await api.get<EventDTO>(`/api/events/${id}`);
        if (!alive) return;
        setEvent(res.data);
        setLoadError(null);
      } catch (e: any) {
        if (!alive) return;
        setLoadError(e?.response?.data?.message || e?.message || "Failed to load event");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // ===== 2) UI states เดิม =====
  const [showDetails, setShowDetails] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SeatPick[]>([]);

  // ===== 3) Utilities =====
  const fmtDate = (iso?: string, opts?: Intl.DateTimeFormatOptions) =>
    iso
      ? new Intl.DateTimeFormat(undefined, {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          ...opts,
        }).format(new Date(iso))
      : "";

  const fmtShortBadge = (iso?: string) =>
    iso
      ? {
          dowShort: new Intl.DateTimeFormat(undefined, { weekday: "short" }).format(new Date(iso)), // Sat/Sun
          day2: new Intl.DateTimeFormat(undefined, { day: "2-digit" }).format(new Date(iso)), // 22
          monShort: new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(iso)), // Mar
          hm: new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(new Date(iso)) + ".M.",
        }
      : null;

  // เตรียม “รอบการแสดง” จาก startAt/endAt ของ event:
  // - ถ้า endAt ต่างวัน จะได้ 2 card (วันเริ่ม/วันจบ)
  // - ถ้าไม่มี หรือเป็นวันเดียวกัน โชว์แค่ 1 card
  const dateCards = useMemo(() => {
    const list: Array<{
      key: string;
      iso: string;
      title: string; // ใช้ event.title
      venueLine1: string; // แยกเป็น 2 บรรทัดเหมือนเดิม
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

    // card วันที่เริ่ม
    list.push({
      key: "start",
      iso: event.startAt,
      title,
      venueLine1: venue,
      venueLine2: "",
      poster,
    });

    // ถ้าต่างวัน เพิ่ม card วันที่จบ
    if (end && !sameDay) {
      list.push({
        key: "end",
        iso: event.endAt!,
        title,
        venueLine1: venue,
        venueLine2: "",
        poster,
      });
    }

    return list;
  }, [event]);

  const scrollToDateSelection = () => {
    const el = document.getElementById("date-selection");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  // ===== 4) ส่วนผังที่นั่ง (mock เดิม) =====
  const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const seatsPerRow = 20;
  const seatZones = {
    vip: { rows: ["A", "B"], price: 5000 },
    standard: { rows: ["C", "D", "E", "F", "G", "H"], price: 1500 },
  };

  const occupiedSeats = new Set<string>([
    "A-1",
    "A-2",
    "A-3",
    "A-4",
    "A-5",
    "A-6",
    "A-7",
    "A-8",
    "A-9",
    "A-10",
    "A-11",
    "A-17",
    "A-18",
    "A-19",
    "A-20",
    "B-4",
    "B-5",
    "B-6",
    "B-8",
    "B-9",
    "B-10",
    "B-12",
    "B-13",
    "B-14",
    "B-16",
    "B-17",
    "B-18",
    "B-19",
    "B-20",
    "C-1",
    "C-3",
    "C-5",
    "C-6",
    "C-7",
    "C-9",
    "C-12",
    "C-15",
    "C-17",
    "C-18",
    "C-19",
    "C-20",
    "D-4",
    "D-6",
    "D-7",
    "D-8",
    "D-10",
    "D-13",
    "D-15",
    "D-16",
    "D-17",
    "D-19",
    "D-20",
    "E-2",
    "E-3",
    "E-4",
    "E-5",
    "E-6",
    "E-9",
    "E-12",
    "E-17",
    "E-19",
    "E-20",
    "F-7",
    "F-12",
    "G-6",
    "G-7",
    "G-9",
    "G-12",
    "G-14",
    "G-15",
    "G-17",
    "G-18",
    "H-2",
    "H-3",
    "H-4",
    "H-5",
    "H-6",
    "H-8",
    "H-12",
    "H-13",
    "H-14",
    "H-15",
    "H-17",
    "H-19",
  ]);

  const getSeatZone = (row: string) =>
    seatZones.vip.rows.includes(row)
      ? { zone: "VIP", price: seatZones.vip.price }
      : { zone: "STANDARD", price: seatZones.standard.price };

  const isSeatOccupied = (row: string, seat: number) => occupiedSeats.has(`${row}-${seat}`);

  useEffect(() => {
    if (selectedDateKey) {
      const el = document.getElementById("seat-map-section");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    }
  }, [selectedDateKey]);

  const handleDateClick = (key: string) => {
    setSelectedSeats([]); // reset seats when change date
    setSelectedDateKey((prev) => (prev === key ? null : key));
  };

  const handleSeatClick = (row: string, seat: number) => {
    if (isSeatOccupied(row, seat)) return;
    const { zone, price } = getSeatZone(row);
    const seatInfo: SeatPick = { row, seat, zone, price };

    setSelectedSeats((prev) => {
      const i = prev.findIndex((s) => s.row === row && s.seat === seat);
      if (i >= 0) return prev.filter((_, idx) => idx !== i);
      return [...prev, seatInfo];
    });
  };

  const isSeatSelected = (row: string, seat: number) =>
    selectedSeats.some((s) => s.row === row && s.seat === seat);

  const getTotalPrice = () => selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const generateReserveId = () =>
    Math.random().toString().slice(2, 17).padStart(15, "0");

  // ===== 5) โหลดสถานะ =====
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

  const startBadge = fmtShortBadge(event.startAt);
  const saleOpen = fmtDate(event.startAt, {});

  return (
    <div className="min-h-screen text-white" style={{ background: "var(--black, #000000)" }}>
      {/* Hero Section */}
      <section className="relative px-6 py-16" style={{ background: "var(--black, #1D1D1D)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Event Poster */}
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

            {/* Event Details */}
            <div className="space-y-6">
              <div className="text-sm" style={{ color: "var(--gray-1, #C3C3C3)" }}>
                {event.startAt ? new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(event.startAt)) : ""}
              </div>

              <h1
                className="text-4xl lg:text-6xl font-bold leading-tight break-words"
                style={{ color: "var(--red, #FA3A2B)", fontFamily: '"Roboto Flex", sans-serif', fontWeight: 800 }}
              >
                {event.title || "Untitled Event"}
              </h1>

              <div className="grid gap-4">
                {/* Show Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Show Date
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                      {event.startAt ? fmtDate(event.startAt) : "-"}
                    </div>
                    {event.endAt && (
                      <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                        {fmtDate(event.endAt)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sale Opening Date (ใช้ startAt เป็นตัวอ้างอิงไปก่อน) */}
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

                {/* Venue */}
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      {event.location || "-"}
                    </div>
                    {event.description && (
                      <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                        {event.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ticket Prices (ยัง mock) */}
                <div className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                  <div>
                    <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                      Ticket Prices
                    </div>
                    <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                      ฿ 500 / ฿ 600 / ฿ 800 / ฿ 1,500 / ฿ 3,500
                      <br />/ ฿ 3,000 / ฿ 2,000 / ฿ 1,500
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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
              {event.description ||
                "No additional description provided for this event."}
            </p>
          </div>
        </section>
      )}

      {/* Event Date Cards Section (แปลงจากข้อมูลจริง) */}
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
                    <div
                      className="text-xs mt-2 px-2 py-1 rounded"
                      style={{ background: "var(--black, #000000)" }}
                    >
                      {new Intl.DateTimeFormat(undefined, { hour: "numeric" }).format(new Date(c.iso))}.M.
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

          {/* Seat map + ซื้อบัตร (ยัง mock) */}
          {selectedDateKey && (
            <div id="seat-map-section" className="mt-8 space-y-6">
              {/* Seat Map */}
              <div
                className="p-8"
                style={{
                  background: "var(--white, #FFFFFF)",
                  borderRadius: "var(--card-radius, 8px)",
                  boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                }}
              >
                <div className="space-y-4">
                  {/* Stage */}
                  <div
                    className="w-full h-12 flex items-center justify-center text-white font-bold text-lg mb-8 mx-auto max-w-2xl"
                    style={{ background: "var(--near-black-3, #1D1D1D)", borderRadius: "8px" }}
                  >
                    STAGE
                  </div>

                  {/* Seat Grid */}
                  <div className="space-y-1 max-w-4xl mx-auto">
                    {seatRows.map((rowLetter) => (
                      <div key={rowLetter} className="flex items-center justify-center gap-1">
                        <div className="w-8 text-center font-bold text-gray-700 text-sm">{rowLetter}</div>
                        <div className="flex gap-1">
                          {Array.from({ length: seatsPerRow }, (_, i) => {
                            const seatNumber = i + 1;
                            const { zone } = getSeatZone(rowLetter);
                            const selected = isSeatSelected(rowLetter, seatNumber);
                            const occupied = isSeatOccupied(rowLetter, seatNumber);

                            return (
                              <button
                                key={seatNumber}
                                onClick={() => handleSeatClick(rowLetter, seatNumber)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all relative ${
                                  !occupied ? "hover:scale-110" : ""
                                }`}
                                style={{
                                  background: selected
                                    ? "var(--red, #FA3A2B)"
                                    : occupied
                                    ? "#2D2D2D"
                                    : zone === "VIP"
                                    ? "#f9f654ff"
                                    : "rgba(201, 255, 184, 1)",
                                  color: selected ? "white" : occupied ? "#4CAF50" : "#2D2D2D",
                                  border: `2px solid ${occupied ? "#2D2D2D" : "#E0E0E0"}`,
                                  cursor: occupied ? "not-allowed" : "pointer",
                                  fontSize: "10px",
                                  fontWeight: "bold",
                                }}
                                disabled={occupied}
                                title={occupied ? `${rowLetter}${seatNumber} (Occupied)` : `${rowLetter}${seatNumber} (${zone})`}
                              >
                                {occupied ? "✕" : seatNumber}
                              </button>
                            );
                          })}
                        </div>
                        <div className="w-8 text-center font-bold text-gray-700 text-sm">{rowLetter}</div>
                      </div>
                    ))}
                  </div>

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

                  {/* Zone Pricing */}
                  <div className="flex justify-center gap-6 mt-4 text-sm text-gray-600">
                    <span>VIP (A-B): ฿5,000</span>
                    <span>Standard (C-H): ฿1,500</span>
                  </div>

                  {/* Selected seats summary */}
                  {selectedSeats.length > 0 && (
                    <div className="flex justify-center mt-4">
                      <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="text-sm text-gray-700">
                          Selected: {selectedSeats.length} seat{selectedSeats.length > 1 ? "s" : ""} | Total: ฿
                          {getTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* บล็อคสรุป & ปุ่มจ่ายเงิน (mock) */}
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
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                ZONE
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--red, #FA3A2B)" }}>
                                {selectedSeats[0].zone}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                ROW
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                {selectedSeats[0].row}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                SEAT
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                {selectedSeats[0].seat}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                PRICE
                              </div>
                              <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                ฿{selectedSeats[0].price.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <button
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
                            Go to Payment
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
                            <div key={`${seat.row}-${seat.seat}`} className="border rounded-lg p-4" style={{ borderColor: "var(--red, #FA3A2B)" }}>
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
                            Go to Payment - {selectedSeats.length} Tickets
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

      {/* Footer */}
      <Footer />
    </div>
  );
}
