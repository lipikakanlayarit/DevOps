// src/pages/Eventselect.tsx
"use client";

import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import Footer from "@/components/Footer";
import SeatMap from "@/components/SeatMap";
import type { Zone } from "@/components/SeatMap";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

/* ==============================
   Types (ให้ตรงกับ BE)
   ============================== */
type EventDetail = {
    id: number;
    eventName: string;
    categoryId?: number;
    startDatetime?: string;
    endDatetime?: string;
    description?: string;
    updatedAt?: string | null;
    coverUpdatedAt?: string | null;
    venueName?: string | null;
    venueAddress?: string | null;
    maxCapacity?: number | null;
    status?: string | null;
    salesStartDatetime?: string | null;
    salesEndDatetime?: string | null;
};

type SetupZone = {
    id?: number | string;
    name?: string;
    code?: string;
    price?: number | null;
    rows?: number;
    cols?: number;
    occupiedSeats?: Array<{ r: number; c: number }>;
    /** ✅ สำคัญ: แม็พกับ ticket_types.ticket_type_id */
    ticketTypeId?: number | null;
};

type SetupResponse = {
    seatRows: number;
    seatColumns: number;
    zones: SetupZone[];
    minPerOrder?: number | null;
    maxPerOrder?: number | null;
    active?: boolean | null;
    salesStartDatetime?: string | null;
    salesEndDatetime?: string | null;
};

/** Zone ที่ใช้ใน UI: เพิ่ม ticketTypeId เข้ามาจาก BE */
type UIZone = Zone & { ticketTypeId?: number | null };

type PickedSeat = {
    zoneId: Zone["id"];
    row: number;
    col: number;
    zoneName: string;
    price: number;
    ticketTypeId?: number | null;
};

/* ==============================
   Helpers
   ============================== */
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

/** ✅ ให้ <img> โหลดผ่าน proxy/baseURL ได้ทั้ง dev/prod */
const API_PREFIX =
    ((api as any)?.defaults?.baseURL as string | undefined)?.replace(/\/+$/, "") || "/api";

const coverPath = (id: number | string, updatedAt?: string | null) =>
    `${API_PREFIX}/public/events/${id}/cover${
        updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : ""
    }`;

function useQuery() {
    const { search } = useLocation();
    return useMemo(() => new URLSearchParams(search), [search]);
}

/* ==============================
   Component
   ============================== */
export default function Eventselect() {
    const params = useParams();
    const query = useQuery();
    const navigate = useNavigate();

    // รองรับทั้ง /eventselect/:eventId และ /eventselect?eventId=...
    const eventId = params.eventId ?? query.get("eventId") ?? undefined;

    const [showDetails, setShowDetails] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const [event, setEvent] = useState<EventDetail | null>(null);
    const [zones, setZones] = useState<UIZone[]>([]);
    const [setupTimes, setSetupTimes] = useState<{
        salesStartDatetime?: string | null;
        salesEndDatetime?: string | null;
    }>({});

    const [submitting, setSubmitting] = useState(false);

    // โหลดข้อมูลจริง
    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;

        (async () => {
            try {
                const evRes = await api.get<EventDetail>(`/public/events/${eventId}`);
                const setupRes = await api.get<SetupResponse>(`/public/events/${eventId}/tickets/setup`);
                if (cancelled) return;

                const ev = evRes.data;
                const setup = setupRes.data;

                setEvent(ev);
                setSetupTimes({
                    salesStartDatetime: setup?.salesStartDatetime ?? null,
                    salesEndDatetime: setup?.salesEndDatetime ?? null,
                });

                const mapped: UIZone[] = (setup?.zones ?? []).map((z: SetupZone, idx: number) => ({
                    id: z.id ?? z.name ?? z.code ?? idx,
                    name: z.name ?? z.code ?? `ZONE-${idx + 1}`,
                    rows: z.rows ?? setup.seatRows ?? 0,
                    cols: z.cols ?? setup.seatColumns ?? 0,
                    price: z.price ?? null,
                    occupied: z.occupiedSeats ?? [],
                    ticketTypeId: z.ticketTypeId ?? null,
                }));
                setZones(mapped);
            } catch (err) {
                console.error("Failed to load event/setup:", err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [eventId]);

    const coverUrl = useMemo(() => {
        if (!event) return null;
        return coverPath(event.id, event.coverUpdatedAt ?? event.updatedAt ?? null);
    }, [event]);

    const scrollToDateSelection = () => {
        const element = document.getElementById("date-selection");
        if (element) element.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (selectedDate) {
            const el = document.getElementById("seat-map-section");
            if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
        }
    }, [selectedDate]);

    const handleDateClick = (date: string) => {
        setSelectedDate((prev) => (prev === date ? null : date));
    };

    // ที่ผู้ใช้เลือก
    const [selectedSeats, setSelectedSeats] = useState<PickedSeat[]>([]);

    const onPickSeat = (zoneId: Zone["id"], r: number, c: number) => {
        const zone = zones.find((z) => z.id === zoneId);
        if (!zone) return;

        // บังคับให้ใน 1 ออเดอร์เป็น ticket type เดียวกัน
        const currentTt = selectedSeats[0]?.ticketTypeId ?? zone.ticketTypeId ?? null;
        const nextTt = zone.ticketTypeId ?? null;
        if (selectedSeats.length > 0 && currentTt !== nextTt) {
            alert("กรุณาเลือกที่นั่งที่อยู่ในประเภทบัตรเดียวกันเท่านั้น");
            return;
        }

        const price = zone.price ?? 0;
        setSelectedSeats((prev) => {
            const i = prev.findIndex((s) => s.zoneId === zoneId && s.row === r && s.col === c);
            if (i >= 0) return prev.filter((_, idx) => idx !== i);
            return [...prev, { zoneId, row: r, col: c, zoneName: zone.name, price, ticketTypeId: zone.ticketTypeId ?? null }];
        });
    };

    const getTotalPrice = () => selectedSeats.reduce((t, s) => t + (s.price || 0), 0);
    const rowLabel = (r: number) => String.fromCharCode("A".charCodeAt(0) + r);

    // ไปหน้าชำระเงิน: ยิง create reservation แล้ว navigate
    const handleGoToPayment = async () => {
        if (!eventId || selectedSeats.length === 0) return;

        // ✅ ticketTypeId ต้องมีตาม schema reserved.ticket_type_id
        const ticketTypeId = selectedSeats[0]?.ticketTypeId ?? null;
        if (!ticketTypeId) {
            alert("ไม่พบประเภทบัตร (ticketTypeId) ของที่นั่งที่เลือก");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                eventId: Number(eventId),
                ticketTypeId, // ✅ สำคัญ
                quantity: selectedSeats.length,
                totalAmount: getTotalPrice(),
                seats: selectedSeats.map((s) => ({
                    zoneId: s.zoneId,
                    rowIndex: s.row,
                    colIndex: s.col,
                    zoneName: s.zoneName,
                    price: s.price ?? 0,
                    rowLabel: rowLabel(s.row),
                    seatNumber: s.col + 1,
                    ticketTypeId: s.ticketTypeId ?? ticketTypeId,
                })),
                notes: "Created from Eventselect UI",
            };

            const { data } = await api.post(`/public/reservations`, payload, {
                headers: { "Content-Type": "application/json" },
            });

            const reservedId = data?.reservedId ?? data?.id ?? data?.reserved_id;
            if (!reservedId) {
                alert("Reservation created but id is missing");
                return;
            }
            navigate(`/payment/${reservedId}`);
        } catch (err: any) {
            console.error("CREATE_RESERVATION_FAILED", err);
            const msg =
                err?.response?.data?.error ||
                err?.response?.data?.message ||
                err?.message ||
                "Internal Server Error";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    // การ์ดวันที่: ถ้ายังไม่มีตารางหลายรอบ ใช้ startDatetime เป็นรอบเดียว
    const dateCards: Array<{ key: string; labelDay: string; day: string; month: string; time: string }> = useMemo(() => {
        const d = event?.startDatetime ? new Date(event.startDatetime) : null;
        if (!d) return [{ key: "show", labelDay: "Show", day: "-", month: "-", time: "-" }];

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return [
            {
                key: "show",
                labelDay: dayNames[d.getDay()],
                day: d.getDate().toString(),
                month: monthNames[d.getMonth()],
                time: `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`,
            },
        ];
    }, [event?.startDatetime]);

    return (
        <div className="min-h-screen text-white" style={{ background: "var(--black, #000000)" }}>
            {/* Hero Section */}
            <section className="relative px-6 py-16" style={{ background: "var(--black, #1D1D1D)" }}>
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Event Poster */}
                        <div className="relative">
                            {coverUrl ? (
                                <img
                                    src={coverUrl}
                                    alt="Event Poster"
                                    className="w-full max-w-md mx-auto rounded-lg shadow-2xl"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                    }}
                                />
                            ) : (
                                <div className="w-full max-w-md mx-auto rounded-lg shadow-2xl bg-gray-700 aspect-[3/4]" />
                            )}
                        </div>

                        {/* Event Details */}
                        <div className="space-y-6">
                            <div className="text-sm" style={{ color: "var(--gray-1, #C3C3C3)" }}>
                                {fmtDateTime(event?.startDatetime)}
                            </div>

                            <h1
                                className="text-4xl lg:text-6xl font-bold leading-tight"
                                style={{ color: "var(--red, #FA3A2B)", fontFamily: '"Roboto Flex", sans-serif', fontWeight: 800 }}
                            >
                                {event?.eventName ?? "Event Title"}
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
                                            {fmtDateTime(event?.startDatetime)} — {fmtDateTime(event?.endDatetime)}
                                        </div>
                                    </div>
                                </div>

                                {/* Sale Opening Date */}
                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                                    <div>
                                        <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                                            Sale Opening Date
                                        </div>
                                        <div style={{ color: "var(--gray-1, #C3C3C3)" }}>{fmtDateTime(setupTimes.salesStartDatetime ?? undefined)}</div>
                                    </div>
                                </div>

                                {/* Venue */}
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                                    <div>
                                        <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                                            {event?.venueName || "-"}
                                        </div>
                                        <div style={{ color: "var(--gray-1, #C3C3C3)" }}>{event?.venueAddress || ""}</div>
                                    </div>
                                </div>

                                {/* Ticket Prices */}
                                <div className="flex items-start gap-3">
                                    <Ticket className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "var(--red, #FA3A2B)" }} />
                                    <div>
                                        <div className="font-semibold" style={{ color: "var(--white, #FFFFFF)" }}>
                                            Ticket Prices
                                        </div>
                                        <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                                            {zones.length > 0
                                                ? zones
                                                    .map((z) => (typeof z.price === "number" ? `฿ ${z.price.toLocaleString()} (${z.name})` : `(${z.name})`))
                                                    .join(" / ")
                                                : "-"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
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
                                    onClick={() => setShowDetails(!showDetails)}
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
                                fontSize: "16px",
                                lineHeight: "1.6",
                                textAlign: "justify",
                                marginBottom: "32px",
                            }}
                        >
                            {event?.description || "No description."}
                        </p>
                    </div>
                </section>
            )}

            {/* Date cards + Seat map */}
            <section id="date-selection" className="px-6 py-8" style={{ background: "#DBDBDB" }}>
                <div className="max-w-4xl mx-auto space-y-6">
                    {dateCards.map((d) => (
                        <div
                            key={d.key}
                            className="overflow-hidden cursor-pointer transition-all hover:shadow-lg"
                            style={{
                                background: selectedDate === d.key ? "var(--red, #FA3A2B)" : "var(--white, #FFFFFF)",
                                borderRadius: "var(--card-radius, 8px)",
                                boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                            }}
                            onClick={() => handleDateClick(d.key)}
                        >
                            <div className="flex">
                                <div
                                    className="p-6 flex flex-col items-center justify-center min-w-[120px]"
                                    style={{ background: "var(--near-black-3, #1D1D1D)", color: "var(--white, #FFFFFF)" }}
                                >
                                    <div className="text-sm">{d.labelDay}</div>
                                    <div className="text-3xl font-bold">{d.day}</div>
                                    <div className="text-sm">{d.month}</div>
                                    <div className="text-xs mt-2 px-2 py-1 rounded" style={{ background: "var(--black, #000000)" }}>
                                        {d.time}
                                    </div>
                                </div>
                                <div className="flex-1 p-6 flex items-center justify-between">
                                    <div>
                                        <h3
                                            className="text-2xl font-bold mb-2"
                                            style={{
                                                color: selectedDate === d.key ? "var(--white, #FFFFFF)" : "var(--red, #FA3A2B)",
                                                fontFamily: '"Roboto Flex", sans-serif',
                                                fontWeight: 800,
                                            }}
                                        >
                                            {event?.eventName ?? "Event Title"}
                                        </h3>
                                        <div
                                            className="flex items-center gap-2"
                                            style={{
                                                color: selectedDate === d.key ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)",
                                            }}
                                        >
                                            <MapPin className="w-4 h-4" />
                                            <span>{event?.venueName || "-"}</span>
                                        </div>
                                        <div style={{ color: selectedDate === d.key ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)" }}>
                                            {event?.venueAddress || ""}
                                        </div>
                                    </div>
                                    <div
                                        className="w-24 h-24 rounded overflow-hidden flex-shrink-0 flex items-center justify-center"
                                        style={{ background: "var(--gray-1, #C3C3C3)" }}
                                    >
                                        {coverUrl ? (
                                            <img
                                                src={coverUrl}
                                                alt="Event Poster"
                                                className="w-full h-full object-cover rounded"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = "none";
                                                }}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {selectedDate && (
                        <div id="seat-map-section" className="mt-8 space-y-6">
                            <div
                                className="p-8"
                                style={{
                                    background: "var(--white, #FFFFFF)",
                                    borderRadius: "var(--card-radius, 8px)",
                                    boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                                }}
                            >
                                <div
                                    className="w-full h-12 flex items-center justify-center text-white font-bold text-lg mb-8 mx-auto max-w-2xl"
                                    style={{ background: "var(--near-black-3, #1D1D1D)", borderRadius: "8px" }}
                                >
                                    STAGE
                                </div>

                                {/* Seat map จาก DB */}
                                <SeatMap zones={zones} onPick={onPickSeat} />

                                {/* Legend */}
                                <div className="flex justify-center gap-4 mt-6 pt-4 border-t flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-200 border" />
                                        <span className="text-sm text-gray-700">Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-gray-400" />
                                        <span className="text-sm text-gray-700">Occupied</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full" style={{ background: "var(--red, #FA3A2B)" }} />
                                        <span className="text-sm text-gray-700">Selected</span>
                                    </div>
                                </div>

                                {/* Pricing */}
                                {zones.length > 0 && (
                                    <div className="flex justify-center gap-4 mt-4 text-sm text-gray-600 flex-wrap">
                                        {zones.map((z) => (
                                            <span key={String(z.id)}>
                        {z.name}: {typeof z.price === "number" ? `฿${z.price.toLocaleString()}` : "-"}
                      </span>
                                        ))}
                                    </div>
                                )}

                                {/* Summary */}
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

                            {/* Ticket summary panel */}
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
                                            <div className="flex items-start gap-4">
                                                <div className="w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg" />
                                                <div className="flex-1 space-y-3">
                                                    <div>
                                                        <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                                                            Reserve
                                                        </div>
                                                        <div className="text-xs text-gray-500">ระบบจะสร้างรายการจองให้อัตโนมัติเมื่อกดชำระเงิน</div>
                                                    </div>

                                                    <div>
                                                        <div className="text-lg font-bold" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                            {event?.eventName ?? "Event Title"}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm" style={{ color: "var(--gray-1, #666)" }}>
                                                            <MapPin className="w-3 h-3" />
                                                            <span>{event?.venueName || "-"}</span>
                                                        </div>
                                                        <div className="text-sm" style={{ color: "var(--gray-1, #666)" }}>{event?.venueAddress || ""}</div>
                                                        <div className="flex items-center gap-1 text-sm mt-1" style={{ color: "var(--gray-1, #666)" }}>
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{fmtDateTime(event?.startDatetime)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                                                        <div className="text-center">
                                                            <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>ZONE</div>
                                                            <div className="font-bold text-lg" style={{ color: "var(--red, #FA3A2B)" }}>
                                                                {selectedSeats[0].zoneName}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>ROW</div>
                                                            <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                                {rowLabel(selectedSeats[0].row)}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>SEAT</div>
                                                            <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                                {selectedSeats[0].col + 1}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>PRICE</div>
                                                            <div className="font-bold text-lg" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                                ฿{(selectedSeats[0].price || 0).toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        disabled={submitting}
                                                        onClick={handleGoToPayment}
                                                        className="w-full mt-4 px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                                                        style={{
                                                            background: "var(--red, #FA3A2B)",
                                                            color: "var(--white, #FFFFFF)",
                                                            border: "none",
                                                            borderRadius: "25px",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {submitting ? "Processing..." : "Go to Payment"}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="text-center border-b pb-4">
                                                    <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                                                        Multiple Tickets Reserved
                                                    </div>
                                                    <div className="text-2xl font-bold mt-2" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                        {event?.eventName ?? "Event Title"}
                                                    </div>
                                                    <div className="flex items-center justify-center gap-1 text-sm mt-1" style={{ color: "var(--gray-1, #666)" }}>
                                                        <Calendar className="w-3 h-3" />
                                                        <span>{fmtDateTime(event?.startDatetime)}</span>
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                                    {selectedSeats.map((s) => (
                                                        <div
                                                            key={`${s.zoneId}-${s.row}-${s.col}`}
                                                            className="border rounded-lg p-4"
                                                            style={{ borderColor: "var(--red, #FA3A2B)" }}
                                                        >
                                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                                <div>
                                                                    <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>ZONE</div>
                                                                    <div className="font-bold text-sm" style={{ color: "var(--red, #FA3A2B)" }}>
                                                                        {s.zoneName}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>SEAT</div>
                                                                    <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                                        {rowLabel(s.row)}
                                                                        {s.col + 1}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>PRICE</div>
                                                                    <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                                        ฿{(s.price || 0).toLocaleString()}
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
                                                        disabled={submitting}
                                                        onClick={handleGoToPayment}
                                                        className="w-full px-6 py-3 rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                                                        style={{
                                                            background: "var(--red, #FA3A2B)",
                                                            color: "var(--white, #FFFFFF)",
                                                            border: "none",
                                                            borderRadius: "25px",
                                                            fontWeight: 600,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {submitting ? "Processing..." : `Go to Payment - ${selectedSeats.length} Tickets`}
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
