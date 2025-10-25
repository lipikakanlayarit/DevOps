"use client";

import { Calendar, Clock, MapPin, Ticket } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
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
    /** เดิมใช้เฉพาะ PAID */
    occupiedSeats?: Array<{ r: number; c: number }>;
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

    /** ✅ ใหม่จาก PublicEventsController: รวมทั้ง PAID และ LOCKED เป็นพิกัด 0-based */
    occupiedSeatMap?: Array<{ seatId: number; zoneId: number; r: number; c: number }>;
};

type UIZone = Zone & { ticketTypeId?: number | null; dbZoneId?: number | null };

type PickedSeat = {
    zoneId: Zone["id"];
    dbZoneId: number | null;
    row: number; // 0-based
    col: number; // 0-based
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

/** ✅ ใช้ baseURL ของ axios เสมอ (รองรับ dev/prod/proxy) */
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

/* 🎨 Palette */
const ZONE_COLORS = ["#C33013", "#B3C071", "#777AD1", "#FDED9F", "#FF8446", "#8CE0BF"];

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

    // ที่ผู้ใช้เลือก
    const [selectedSeats, setSelectedSeats] = useState<PickedSeat[]>([]);

    /** -------------------------------
     *  ฟังก์ชันแม็พ setup → zones UI
     *  ------------------------------- */
    const mapSetupToUI = useCallback((setup: SetupResponse | undefined | null): UIZone[] => {
        // ✅ รวมทั้ง PAID และ LOCKED จาก BE (0-based แล้ว)
        const occupiedFromBE = setup?.occupiedSeatMap ?? [];

        // group by zoneId (จริงจาก DB)
        const zoneOccupied = occupiedFromBE.reduce((acc, o) => {
            const zId = Number(o.zoneId);
            if (!acc[zId]) acc[zId] = [];
            acc[zId].push({ r: o.r, c: o.c });
            return acc;
        }, {} as Record<number, { r: number; c: number }[]>);

        return (setup?.zones ?? []).map((z: SetupZone, idx: number) => {
            // ดึง zone_id จริงเป็น number
            let dbZoneId: number | null = null;
            if (typeof z.id === "number") dbZoneId = z.id;
            else if (typeof z.id === "string" && /^\d+$/.test(z.id)) dbZoneId = Number(z.id);

            return {
                id: z.id ?? z.name ?? z.code ?? idx,
                name: z.name ?? z.code ?? `ZONE-${idx + 1}`,
                rows: z.rows ?? setup?.seatRows ?? 0,
                cols: z.cols ?? setup?.seatColumns ?? 0,
                price: z.price ?? null,
                // ✅ ใช้ occupied ที่คำนวณจาก occupiedSeatMap เป็นหลัก
                occupied: zoneOccupied[dbZoneId ?? -1] ?? z.occupiedSeats ?? [],
                ticketTypeId: z.ticketTypeId ?? null,
                color: ZONE_COLORS[idx % ZONE_COLORS.length],
                dbZoneId,
            };
        });
    }, []);

    /** -------------------------------
     *  โหลด event + setup ครั้งแรก
     *  ------------------------------- */
    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;

        (async () => {
            try {
                const [evRes, setupRes] = await Promise.all([
                    api.get<EventDetail>(`/public/events/${eventId}`),
                    api.get<SetupResponse>(`/public/events/${eventId}/tickets/setup`),
                ]);
                if (cancelled) return;

                const ev = evRes.data;
                const setup = setupRes.data;

                setEvent(ev);
                setSetupTimes({
                    salesStartDatetime: setup?.salesStartDatetime ?? ev?.salesStartDatetime ?? null,
                    salesEndDatetime: setup?.salesEndDatetime ?? ev?.salesEndDatetime ?? null,
                });
                setZones(mapSetupToUI(setup));
            } catch (err) {
                console.error("Failed to load event/setup:", err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [eventId, mapSetupToUI]);

    /** -------------------------------
     *  ดึง setup ล่าสุด (ใช้ทั่วไป)
     *  ------------------------------- */
    const fetchSetupLatest = useCallback(async () => {
        if (!eventId) return;
        try {
            const { data: setup } = await api.get<SetupResponse>(
                `/public/events/${eventId}/tickets/setup?t=${Date.now()}`
            );
            setSetupTimes((prev) => ({
                salesStartDatetime: setup?.salesStartDatetime ?? prev.salesStartDatetime ?? null,
                salesEndDatetime: setup?.salesEndDatetime ?? prev.salesEndDatetime ?? null,
            }));
            setZones(mapSetupToUI(setup));
        } catch (e) {
            console.warn("Refetch setup failed:", e);
        }
    }, [eventId, mapSetupToUI]);

    /** -------------------------------
     *  refetch เมื่อหน้า “กลับมาแอคทีฟ”
     *  รวม pageshow กัน BFCache
     *  ------------------------------- */
    useEffect(() => {
        const onVisibility = () => {
            if (document.visibilityState === "visible") void fetchSetupLatest();
        };
        const onFocus = () => {
            void fetchSetupLatest();
        };
        const onPageShow = () => {
            // กลับจาก BFCache: เคลียร์ selection แล้วดึงข้อมูลใหม่
            setSelectedSeats([]);
            void fetchSetupLatest();
        };

        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("focus", onFocus);
        window.addEventListener("pageshow", onPageShow as EventListener);

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("pageshow", onPageShow as EventListener);
        };
    }, [fetchSetupLatest]);

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

    // ✅ Helper: เช็กว่า (zoneId, r, c) ถูกยึดแล้วหรือยัง จาก zones[].occupied
    const isOccupied = useCallback(
        (zoneId: Zone["id"], r: number, c: number) => {
            const z = zones.find((zz) => String(zz.id) === String(zoneId));
            if (!z) return false;
            return (z.occupied ?? []).some((o) => o.r === r && o.c === c);
        },
        [zones]
    );

    const onPickSeat = (zoneId: Zone["id"], r: number, c: number) => {
        const zone = zones.find((z) => String(z.id) === String(zoneId));
        if (!zone) return;

        // ❌ กันเลือกทับ X ที่ BE แจ้งมา
        if (isOccupied(zoneId, r, c)) {
            alert("ที่นั่งนี้ถูกจองไปแล้ว");
            return;
        }

        const price = zone.price ?? 0;
        setSelectedSeats((prev) => {
            const i = prev.findIndex((s) => String(s.zoneId) === String(zoneId) && s.row === r && s.col === c);
            if (i >= 0) return prev.filter((_, idx) => idx !== i);
            return [
                ...prev,
                {
                    zoneId,
                    dbZoneId: zone.dbZoneId ?? null,
                    row: r,
                    col: c,
                    zoneName: zone.name,
                    price,
                    ticketTypeId: zone.ticketTypeId ?? null,
                },
            ];
        });
    };

    const getTotalPrice = () => selectedSeats.reduce((t, s) => t + (s.price || 0), 0);
    const rowLabel = (r: number) => String.fromCharCode("A".charCodeAt(0) + r);

    // ✅ สถานะ (ONSALE / UPCOMING / OFFSALE)
    const effectiveStatus: "ONSALE" | "UPCOMING" | "OFFSALE" = useMemo(() => {
        const now = Date.now();
        const s = setupTimes?.salesStartDatetime ? +new Date(setupTimes.salesStartDatetime) : 0;
        const e = setupTimes?.salesEndDatetime ? +new Date(setupTimes.salesEndDatetime) : 0;

        if (s && e && now >= s && now <= e) return "ONSALE";
        if (s && now < s) return "UPCOMING";
        return "OFFSALE";
    }, [setupTimes?.salesStartDatetime, setupTimes?.salesEndDatetime]);

    /* ==============================
       ✅ Go to Payment Handler
       ============================== */
    const handleGoToPayment = async () => {
        if (selectedSeats.length === 0 || !eventId) {
            alert("กรุณาเลือกที่นั่งก่อนดำเนินการชำระเงิน");
            return;
        }

        // ต้องมี dbZoneId ครบทุกที่นั่ง
        const invalid = selectedSeats.find((s) => !s.dbZoneId || Number.isNaN(Number(s.dbZoneId)));
        if (invalid) {
            alert("ไม่พบรหัสโซน (zone_id) สำหรับบางที่นั่ง — โปรดรีเฟรชหรือเลือกใหม่");
            return;
        }

        try {
            setSubmitting(true);

            // 🔄 ดึง setup ล่าสุดแบบ in-place เพื่อใช้ตรวจชนทันที (ไม่พึ่ง state)
            const { data: latestSetup } = await api.get<SetupResponse>(
                `/public/events/${eventId}/tickets/setup?t=${Date.now()}`
            );
            const latestZones = mapSetupToUI(latestSetup);

            // อัปเดต state ให้ UI ทันสมัยด้วย
            setSetupTimes((prev) => ({
                salesStartDatetime: latestSetup?.salesStartDatetime ?? prev.salesStartDatetime ?? null,
                salesEndDatetime: latestSetup?.salesEndDatetime ?? prev.salesEndDatetime ?? null,
            }));
            setZones(latestZones);

            // ถ้ามีตัวซ้ำกับ occupied ล่าสุด ให้ตัดออกก่อน
            const collided = selectedSeats.filter((s) => {
                const z = latestZones.find((zz) => String(zz.id) === String(s.zoneId));
                return z && (z.occupied ?? []).some((o) => o.r === s.row && o.c === s.col);
            });

            if (collided.length > 0) {
                setSelectedSeats((prev) =>
                    prev.filter(
                        (s) =>
                            !collided.some(
                                (c) => String(c.zoneId) === String(s.zoneId) && c.row === s.row && c.col === s.col
                            )
                    )
                );
                alert("มีบางที่นั่งถูกจองไปแล้ว ระบบได้ตัดที่นั่งนั้นออกให้ กรุณาเลือกใหม่");
                return; // ให้ผู้ใช้กดอีกครั้งหลังเลือกใหม่
            }

            const payload = {
                eventId: Number(eventId),
                quantity: selectedSeats.length,
                totalAmount: getTotalPrice(),
                seats: selectedSeats.map((s) => ({
                    zoneId: Number(s.dbZoneId), // 👈 ส่ง zone_id จริงเท่านั้น
                    row: s.row, // 0-based (BE แปลงเอง)
                    col: s.col, // 0-based (BE แปลงเป็น seat_number = col+1)
                })),
            };

            const { data } = await api.post("/public/reservations", payload);
            const reservedId = data?.reservedId ?? data?.id;
            if (reservedId) {
                navigate(`/payment/${reservedId}`);
            } else {
                alert("ไม่สามารถสร้างรายการจองได้");
            }
        } catch (err: any) {
            console.error("Reservation failed:", err);
            const msg =
                err?.response?.data?.error || err?.message || "เกิดข้อผิดพลาดในการสร้างรายการจอง";
            alert(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const isOnSale = effectiveStatus === "ONSALE";
    const isUpcoming = effectiveStatus === "UPCOMING";

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
                                        (e.currentTarget as HTMLImageElement).style.display = "none";
                                    }}
                                />
                            ) : (
                                <div className="w-full max-w-md mx-auto rounded-lg shadow-2xl bg-gray-700 aspect-[3/4]" />
                            )}

                            {/* ✅ Badge แสดงสถานะ */}
                            <div className="absolute top-3 left-3">
                                {isUpcoming && (
                                    <span className="px-3 py-1 rounded-md text-xs font-bold" style={{ background: "#111", color: "#fff" }}>
                    COMING SOON
                  </span>
                                )}
                                {!isOnSale && !isUpcoming && (
                                    <span className="px-3 py-1 rounded-md text-xs font-bold bg-gray-300 text-black">OFFSALE</span>
                                )}
                            </div>
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
                                        <div style={{ color: "var(--gray-1, #C3C3C3)" }}>
                                            {fmtDateTime(setupTimes.salesStartDatetime ?? undefined)}
                                        </div>
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
                                                    .map((z) =>
                                                        typeof z.price === "number"
                                                            ? `฿ ${z.price.toLocaleString()} (${z.name})`
                                                            : `(${z.name})`
                                                    )
                                                    .join(" / ")
                                                : "-"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => (isOnSale ? scrollToDateSelection() : undefined)}
                                    disabled={!isOnSale}
                                    className="px-8 py-3 rounded-full font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                                    style={{
                                        background: "var(--red, #FA3A2B)",
                                        color: "var(--white, #FFFFFF)",
                                        border: "none",
                                        borderRadius: "10px",
                                        fontWeight: 600,
                                        cursor: isOnSale ? "pointer" : "not-allowed",
                                    }}
                                >
                                    {isOnSale ? "Get Ticket" : isUpcoming ? "COMING SOON" : "OFFSALE"}
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

            {/* Date cards + Seat map / Coming soon */}
            <section id="date-selection" className="px-6 py-8" style={{ background: "#DBDBDB" }}>
                <div className="max-w-4xl mx-auto space-y-6">
                    {useMemo(() => {
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
                    }, [event?.startDatetime]).map((d) => (
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
                                        <div
                                            style={{
                                                color: selectedDate === d.key ? "var(--white, #FFFFFF)" : "var(--near-black-1, #100F0F)",
                                            }}
                                        >
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
                                                    (e.currentTarget as HTMLImageElement).style.display = "none";
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
                            {/* ถ้าไม่ใช่ช่วงขาย */}
                            {!isOnSale ? (
                                <div
                                    className="p-8 text-center"
                                    style={{
                                        background: "var(--white, #FFFFFF)",
                                        borderRadius: "var(--card-radius, 8px)",
                                        boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                                    }}
                                >
                                    <div
                                        className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-3"
                                        style={{ background: "#111", color: "#fff" }}
                                    >
                                        {isUpcoming ? "COMING SOON" : "OFFSALE"}
                                    </div>
                                    <div className="text-neutral-700">
                                        {isUpcoming
                                            ? `Sales start: ${fmtDateTime(setupTimes.salesStartDatetime ?? undefined)}`
                                            : `Sales ended: ${fmtDateTime(setupTimes.salesEndDatetime ?? undefined)}`}
                                    </div>
                                    <div className="text-neutral-500 mt-2">You can still read the event details above.</div>
                                </div>
                            ) : (
                                <>
                                    {/* Seat map จาก DB */}
                                    <div
                                        className="p-8"
                                        style={{
                                            background: "var(--white, #FFFFFF)",
                                            borderRadius: "var(--card-radius, 8px)",
                                            boxShadow: "var(--shadow-1, 0 8px 24px rgba(0,0,0,.15))",
                                        }}
                                    >
                                        <SeatMap
                                            zones={zones}
                                            selected={selectedSeats.map((s) => ({
                                                zoneId: s.zoneId,
                                                r: s.row,
                                                c: s.col,
                                            }))}
                                            onPick={onPickSeat}
                                            effectiveStatus={effectiveStatus}
                                            aisleEvery={Math.max(1, Math.floor((zones[0]?.cols ?? 10) / 2))}
                                        />

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
                                                <div className="space-y-6">
                                                    <div className="text-center border-b pb-4">
                                                        <div className="text-sm font-semibold" style={{ color: "var(--red, #FA3A2B)" }}>
                                                            Multiple Tickets Reserved
                                                        </div>
                                                        <div className="text-2xl font-bold mt-2" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                            {event?.eventName ?? "Event Title"}
                                                        </div>
                                                        <div
                                                            className="flex items-center justify-center gap-1 text-sm mt-1"
                                                            style={{ color: "var(--gray-1, #666)" }}
                                                        >
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
                                                                        <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                                                            ZONE
                                                                        </div>
                                                                        <div className="font-bold text-sm" style={{ color: "var(--red, #FA3A2B)" }}>
                                                                            {s.zoneName}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                                                            SEAT
                                                                        </div>
                                                                        <div className="font-bold text-sm" style={{ color: "var(--near-black-1, #100F0F)" }}>
                                                                            {rowLabel(s.row)}
                                                                            {s.col + 1}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <div className="text-xs" style={{ color: "var(--gray-1, #666)" }}>
                                                                            PRICE
                                                                        </div>
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
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
