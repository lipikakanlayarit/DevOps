// src/pages/admin-eventdetail.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { ChevronRight, X } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryRadio from "@/components/CategoryRadio";
import OutlineButton from "@/components/OutlineButton";
import { api } from "@/lib/api";
import AuthImage from "@/components/AuthImage";
import posterFallback from "@/assets/poster.png";

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

const coverPath = (id: string | number, updatedAt?: string) =>
    `/admin/events/${id}/cover${updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : ""}`;

const categoryLabel = (id?: number | null) => {
    if (id === 1) return "Concert";
    if (id === 2) return "Seminar";
    if (id === 3) return "Exhibition";
    return "Other";
};

const fmtInt = (n?: number | null) =>
    typeof n === "number" && Number.isFinite(n) ? n.toLocaleString() : "-";

/* ==============================
   Types
   ============================== */
type EventResponse = {
    id: number;
    organizerId?: number;
    organizerName?: string;
    eventName: string;
    description?: string;
    categoryId?: number;
    startDateTime?: string;
    endDateTime?: string;
    salesStartDateTime?: string;
    salesEndDateTime?: string;
    venueName?: string;
    venueAddress?: string;
    maxCapacity?: number;
    status?: string;
    updatedAt?: string;
};

type UiEvent = {
    id: number | string;
    title: string;
    category: string;
    organizer: string;
    organizerId?: number;
    showStart?: string;
    showEnd?: string;
    saleStart?: string;
    saleEnd?: string;
    location?: string;
    address?: string;
    posterUrl: string;
    description?: string;
    capacity?: number;
    status?: string;
    updatedAt?: string;
};

type OrganizerDetail = {
    id: number;
    companyName: string;
    phoneNumber: string;
    address: string;
    email?: string;
    username?: string;
};

type TicketZone = {
    zone: string;
    row: number;
    column: number;
    sale: string; // e.g. "12/50"
    price: string; // e.g. "5,000" or "-"
};

type Reservation = {
    id: string;
    seatId: string;
    total: string;
    user: string;
    status: "COMPLETE" | "UNPAID";
    date: string;
    paymentMethod: string;
};

type ResvFilter = "all" | "reserved" | "sold";

type SeatStats = {
    total: number;
    sold: number;
    reserved: number;
    available: number;
};

const isSold = (r: Reservation) => r.status === "COMPLETE";
const isReserved = (r: Reservation) => !isSold(r);

/* ==============================
   Pagination Controls
   ============================== */
const PaginationControls = ({
                                currentPage,
                                totalPages,
                                onPageChange,
                                showPageNumbers = true,
                            }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
    showPageNumbers?: boolean;
}) => {
    const maxVisiblePages = 5;

    const getVisiblePages = () => {
        if (totalPages <= maxVisiblePages) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const half = Math.floor(maxVisiblePages / 2);
        let start = Math.max(1, currentPage - half);
        let end = Math.min(totalPages, start + maxVisiblePages - 1);
        if (end - start < maxVisiblePages - 1) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="bg-white px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
                {/* Mobile */}
                <div className="flex-1 flex justify-between sm:hidden">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>

                {/* Desktop */}
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">
                        Page <span className="font-medium">{currentPage}</span> of{" "}
                        <span className="font-medium">{totalPages}</span>
                    </p>

                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Previous</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>

                        {visiblePages[0] > 1 && (
                            <>
                                <button
                                    onClick={() => onPageChange(1)}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    1
                                </button>
                                {visiblePages[0] > 2 && (
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                                )}
                            </>
                        )}

                        {showPageNumbers &&
                            visiblePages.map((n) => (
                                <button
                                    key={n}
                                    onClick={() => onPageChange(n)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                        currentPage === n
                                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}

                        {visiblePages[visiblePages.length - 1] < totalPages && (
                            <>
                                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    ...
                  </span>
                                )}
                                <button
                                    onClick={() => onPageChange(totalPages)}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    {totalPages}
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="sr-only">Next</span>
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path
                                    fillRule="evenodd"
                                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    </nav>
                </div>
            </div>
        </div>
    );
};

/* ==============================
   Modals
   ============================== */
function OrganizerDetailModal({
                                  open,
                                  onClose,
                                  organizerId,
                              }: {
    open: boolean;
    onClose: () => void;
    organizerId?: number;
}) {
    const [org, setOrg] = useState<OrganizerDetail | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !organizerId) {
            setOrg(null);
            return;
        }
        (async () => {
            setLoading(true);
            try {
                const res = await api.get(`/admin/organizers/${organizerId}`);
                setOrg(res.data as OrganizerDetail);
            } catch (e) {
                console.error("load organizer error:", e);
                setOrg(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [open, organizerId]);

    if (!open) return null;
    const stop = (e: React.MouseEvent) => e.stopPropagation();

    const InfoRow = ({ label, value }: { label: string; value?: string }) => (
        <div className="bg-white rounded-lg p-4 shadow-sm">
            <span className="block text-sm font-medium text-gray-500 mb-1">{label}</span>
            <span className="text-lg font-semibold text-gray-900">{value && value.trim() ? value : "-"}</span>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="organizer-detail-title"
        >
            <div
                className="w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={stop}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
                    <h3 id="organizer-detail-title" className="text-2xl font-bold text-gray-900">
                        Organizer Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                <div className="h-16 bg-gray-200 rounded" />
                                <div className="h-16 bg-gray-200 rounded" />
                                <div className="h-24 bg-gray-200 rounded" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <InfoRow label="Company" value={org?.companyName} />
                                <InfoRow label="Phone Number" value={org?.phoneNumber} />
                                <InfoRow label="Address" value={org?.address} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

function DetailModal({
                         open,
                         onClose,
                         event,
                     }: {
    open: boolean;
    onClose: () => void;
    event: UiEvent | null;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open || !event) return null;
    const stop = (e: React.MouseEvent) => e.stopPropagation();

    const Info = ({ label, value }: { label: string; value?: string }) => (
        <div className="bg-white rounded-lg p-3 shadow-sm">
            <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{value || "-"}</span>
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-detail-title"
        >
            <div
                className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={stop}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 id="event-detail-title" className="text-2xl font-bold text-gray-900">
                        {event.title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="flex justify-center lg:justify-start">
                                    <AuthImage
                                        src={event.posterUrl}
                                        alt={event.title}
                                        fallback={posterFallback}
                                        className="w-72 h-96 object-cover rounded-xl shadow-lg"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <Info label="Category" value={event.category} />
                                        <Info label="Organizer" value={event.organizer} />
                                        <Info label="Show Start" value={fmtDateTime(event.showStart)} />
                                        <Info label="Show End" value={fmtDateTime(event.showEnd)} />
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        <Info
                                            label="Sale Period"
                                            value={
                                                event.saleStart
                                                    ? event.saleEnd && event.saleEnd !== event.saleStart
                                                        ? `${fmtDateTime(event.saleStart)} → ${fmtDateTime(event.saleEnd)}`
                                                        : fmtDateTime(event.saleStart)
                                                    : "-"
                                            }
                                        />
                                        <Info label="Location" value={event.location} />
                                        {event.address && <Info label="Address" value={event.address} />}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-white rounded-xl p-6 shadow-sm border">
                                <h4 className="text-lg font-bold text-gray-900 mb-3">Event Description</h4>
                                <p className="text-gray-700 leading-relaxed">{event.description || "-"}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
                    <OutlineButton onClick={onClose}>Close</OutlineButton>
                </div>
            </div>
        </div>
    );
}

/* ==============================
   Page
   ============================== */
export default function AdminEventdetail() {
    const { search } = useLocation();
    const id = useMemo(() => new URLSearchParams(search).get("id") ?? "", [search]);

    // ---- State (ประกาศครั้งเดียว) ----
    const [item, setItem] = useState<UiEvent | null>(null);
    const [loading, setLoading] = useState(true);

    const [openDetail, setOpenDetail] = useState(false);
    const [openOrganizerDetail, setOpenOrganizerDetail] = useState(false);

    const [query, setQuery] = useState("");
    const [resvFilter, setResvFilter] = useState<ResvFilter>("all");

    const TICKETZONE_PAGE_SIZE = 5;
    const RESV_PAGE_SIZE = 10;

    const [tzPage, setTzPage] = useState(1);
    const [resvPage, setResvPage] = useState(1);

    const [ticketZones, setTicketZones] = useState<TicketZone[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [seatStats, setSeatStats] = useState<SeatStats>({ total: 0, sold: 0, reserved: 0, available: 0 });

    // Load event detail + zones + seat stats + reservations
    useEffect(() => {
        if (!id) return;
        (async () => {
            setLoading(true);
            try {
                // Event
                const res = await api.get(`/admin/events/${id}`);
                const ev: EventResponse = res.data ?? {};

                const ui: UiEvent = {
                    id: ev.id ?? id,
                    title: ev.eventName ?? "-",
                    category: categoryLabel(ev.categoryId),
                    organizer: ev.organizerName ?? (ev.organizerId != null ? `Organizer #${ev.organizerId}` : "-"),
                    organizerId: ev.organizerId,
                    showStart: ev.startDateTime,
                    showEnd: ev.endDateTime,
                    saleStart: ev.salesStartDateTime,
                    saleEnd: ev.salesEndDateTime,
                    location: ev.venueName ?? "-",
                    address: ev.venueAddress ?? "",
                    posterUrl: coverPath(ev.id ?? id, ev.updatedAt),
                    description: ev.description ?? "",
                    capacity: ev.maxCapacity ?? undefined,
                    status: ev.status ?? "",
                    updatedAt: ev.updatedAt,
                };
                setItem(ui);

                // Zones
                try {
                    const z = await api.get(`/admin/events/${id}/zones`);
                    const zones: TicketZone[] = (z.data ?? []).map((it: any) => ({
                        zone: String(it.zone ?? "-"),
                        row: Number(it.row ?? 0),
                        column: Number(it.column ?? 0),
                        price: it.price != null ? String(it.price) : "Price/ticket",
                        sale: String(it.sale ?? "0/0"),
                    }));
                    setTicketZones(zones);
                } catch (err) {
                    console.warn("load zones failed:", err);
                    setTicketZones([]);
                }

                // Seat stats (จริงจาก backend)
                try {
                    const s = await api.get(`/admin/events/${id}/seat-stats`);
                    const body = s.data ?? {};
                    setSeatStats({
                        total: Number(body.total ?? 0),
                        sold: Number(body.sold ?? 0),
                        reserved: Number(body.reserved ?? 0),
                        available: Number(body.available ?? 0),
                    });
                } catch (err) {
                    console.warn("load seat-stats failed:", err);
                    setSeatStats({ total: 0, sold: 0, reserved: 0, available: 0 });
                }

                // Reservations (จริงจาก backend)
                try {
                    const r = await api.get(`/admin/events/${id}/reservations`);
                    const list: Reservation[] = (r.data ?? []).map((it: any) => ({
                        id: String(it.id ?? it.reserved_code ?? "-"),
                        seatId:
                            (it.seat_label ??
                                ([it.zone_label, it.row_label, it.seat_number].filter(Boolean).join(" ") || "-")) || "-",
                        total:
                            typeof it.total === "number"
                                ? it.total.toLocaleString()
                                : it.total
                                    ? String(it.total)
                                    : "-",
                        // ✅ FIX: รองรับทั้ง "user" และ "username"
                        user: it.user ?? it.username ?? "-",
                        status: (String(it.status ?? "").toUpperCase() === "PAID" ? "COMPLETE" : "UNPAID") as
                            | "COMPLETE"
                            | "UNPAID",
                        date: it.date
                            ? new Date(it.date).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                            })
                            : "-",
                        paymentMethod: it.payment_method ?? "-",
                    }));
                    setReservations(list);

                    // ถ้าโหลด seat-stats ไม่สำเร็จ ให้ fallback คำนวณจาก reservations
                    setSeatStats((prev) => {
                        if (prev.total || prev.sold || prev.reserved || prev.available) return prev;
                        const sold = list.filter(isSold).length;
                        const reserved = list.length - sold;
                        const capacity = ui.capacity ?? 0;
                        const available = Math.max(0, Number(capacity) - list.length);
                        return { total: capacity, sold, reserved, available };
                    });
                } catch (err) {
                    console.error("load reservations error:", err);
                    setReservations([]);
                }
            } catch (e) {
                console.error("load event detail error:", e);
                setItem(null);
                setTicketZones([]);
                setReservations([]);
                setSeatStats({ total: 0, sold: 0, reserved: 0, available: 0 });
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // Zones pagination
    const tzTotalPages = Math.max(1, Math.ceil(ticketZones.length / TICKETZONE_PAGE_SIZE));
    const tzPageItems = useMemo(() => {
        const start = (tzPage - 1) * TICKETZONE_PAGE_SIZE;
        return ticketZones.slice(start, start + TICKETZONE_PAGE_SIZE);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tzPage, ticketZones]);

    useEffect(() => {
        setTzPage(1);
    }, [ticketZones]);

    // Reservations filter + pagination
    const filteredReservations = useMemo(() => {
        let list = reservations;
        if (resvFilter === "sold") list = list.filter(isSold);
        if (resvFilter === "reserved") list = list.filter(isReserved);

        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((r) =>
                [r.id, r.seatId, r.total, r.user, r.status, r.date, r.paymentMethod].join(" ").toLowerCase().includes(q)
            );
        }
        return list;
    }, [query, resvFilter, reservations]);

    const resvTotalPages = Math.max(1, Math.ceil(filteredReservations.length / RESV_PAGE_SIZE));
    const resvPageItems = useMemo(() => {
        const start = (resvPage - 1) * RESV_PAGE_SIZE;
        return filteredReservations.slice(start, start + RESV_PAGE_SIZE);
    }, [filteredReservations, resvPage]);

    useEffect(() => {
        setResvPage(1);
    }, [query, resvFilter]);

    return (
        <div className="bg-gray-100 min-h-screen">
            <Sidebar />

            <div className="ml-64 flex flex-col">
                {/* Header / Breadcrumb */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-100">
                    <div className="flex items-center text-xl font-bold text-gray-800">
                        <Link
                            to="/admin"
                            className="text-gray-600 hover:text-gray-900 hover:underline focus:underline outline-none"
                            aria-label="Back to Event Management (admin)"
                        >
                            Event Management
                        </Link>
                        <ChevronRight className="mx-2 h-5 w-5 text-gray-500" />
                        <span className="truncate">
              {item?.title ?? (loading ? "Loading..." : "Not found")}
                            {id ? ` (ID: ${id})` : ""}
            </span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                    {/* Row: Detail + Ticket Zones */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Event Info */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            {loading ? (
                                <div className="animate-pulse flex gap-6">
                                    <div className="w-40 h-56 bg-gray-200 rounded-lg" />
                                    <div className="flex-1 space-y-3">
                                        <div className="h-6 w-64 bg-gray-200 rounded" />
                                        <div className="h-4 w-40 bg-gray-200 rounded" />
                                        <div className="h-4 w-72 bg-gray-200 rounded" />
                                    </div>
                                </div>
                            ) : !item ? (
                                <div className="text-sm text-gray-600">Event not found.</div>
                            ) : (
                                <div className="flex gap-6">
                                    <div className="flex-shrink-0">
                                        <AuthImage
                                            src={item.posterUrl}
                                            alt={item.title}
                                            fallback={posterFallback}
                                            className="w-40 h-56 object-cover rounded-lg"
                                        />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <h1 className="text-2xl font-bold text-gray-800">{item.title}</h1>

                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Category:</span>
                                                <span className="ml-2 text-gray-800">{item.category}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Organizer:</span>
                                                <span className="ml-2 text-gray-800">{item.organizer}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Show Date:</span>
                                                <span className="ml-2 text-gray-800">
                          {item.showStart
                              ? item.showEnd && item.showEnd !== item.showStart
                                  ? `${fmtDateTime(item.showStart)} → ${fmtDateTime(item.showEnd)}`
                                  : fmtDateTime(item.showStart)
                              : "-"}
                        </span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500">Sale Period:</span>
                                                <span className="ml-2 text-gray-800">
                          {item.saleStart
                              ? item.saleEnd && item.saleEnd !== item.saleStart
                                  ? `${fmtDateTime(item.saleStart)} → ${fmtDateTime(item.saleEnd)}`
                                  : fmtDateTime(item.saleStart)
                              : "-"}
                        </span>
                                            </div>

                                            <div>
                                                <span className="text-gray-500">Location:</span>
                                                <span className="ml-2 text-gray-800">{item.location}</span>
                                            </div>
                                            {item.capacity != null && (
                                                <div>
                                                    <span className="text-gray-500">Capacity:</span>
                                                    <span className="ml-2 text-gray-800">{fmtInt(item.capacity)}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setOpenDetail(true)}
                                                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                                            >
                                                Event detail
                                            </button>
                                            <button
                                                onClick={() => setOpenOrganizerDetail(true)}
                                                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                                                disabled={!item.organizerId}
                                                title={!item.organizerId ? "Organizer not specified" : undefined}
                                            >
                                                Organizer detail
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Ticket Zones */}
                        <div className="space-y-0">
                            <div className="bg-white rounded-t-lg p-6 shadow-sm">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Ticket Zones</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Ticket Zone</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Row</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Column</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Sale</th>
                                            <th className="text-left py-3 px-4 font-semibold text-gray-700">Price/ticket</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {tzPageItems.map((z, i) => (
                                            <tr key={`${z.zone}-${i}`} className="border-b border-gray-100">
                                                <td className="py-3 px-4 text-gray-800">{z.zone}</td>
                                                <td className="py-3 px-4 text-gray-800">{fmtInt(z.row)}</td>
                                                <td className="py-3 px-4 text-gray-800">{fmtInt(z.column)}</td>
                                                <td className="py-3 px-4 text-gray-800">{z.sale}</td>
                                                <td className="py-3 px-4 text-gray-800">{z.price}</td>
                                            </tr>
                                        ))}
                                        {tzPageItems.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="py-6 px-4 text-center text-sm text-gray-500">
                                                    No ticket zones.
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="bg-white rounded-b-lg shadow-sm">
                                <PaginationControls currentPage={tzPage} totalPages={tzTotalPages} onPageChange={setTzPage} showPageNumbers />
                            </div>
                        </div>
                    </div>

                    {/* Seat stats + filter + search */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex gap-4">
                            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                                Available Seat: {seatStats.available}
                            </div>
                            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
                                Reserved Seat: {seatStats.reserved}
                            </div>
                            <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium">
                                Sold Seat: {seatStats.sold}
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <CategoryRadio
                                options={[
                                    { label: "All", value: "all" },
                                    { label: "Reserved", value: "reserved" },
                                    { label: "Sold", value: "sold" },
                                ]}
                                value={resvFilter}
                                onChange={(val) => setResvFilter(val as ResvFilter)}
                            />
                            <SearchBar
                                value={query}
                                onChange={setQuery}
                                width="w-[300px] md:w-[360px]"
                                height="h-11"
                                placeholder="Search reservations..."
                            />
                        </div>
                    </div>

                    {/* Reservations */}
                    <div className="space-y-0">
                        <div className="bg-white rounded-t-lg shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Reservations</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">
                                            <input type="checkbox" className="rounded" />
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">RESERVED</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">DATE</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">SEAT ID</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">TOTAL</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">USER</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">PAYMENT METHOD</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">STATUS</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {resvPageItems.map((r, i) => (
                                        <tr key={`${r.id}-${i}`} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <input type="checkbox" className="rounded" />
                                            </td>
                                            <td className="py-3 px-4 text-gray-800 font-mono text-sm">{r.id}</td>
                                            <td className="py-3 px-4 text-gray-800">{r.date}</td>
                                            <td className="py-3 px-4 text-gray-800">{r.seatId}</td>
                                            <td className="py-3 px-4 text-gray-800">{r.total}</td>
                                            <td className="py-3 px-4 text-gray-800">{r.user}</td>
                                            <td className="py-3 px-4 text-gray-800">{r.paymentMethod}</td>
                                            <td className="py-3 px-4">
                          <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  r.status === "COMPLETE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {r.status === "COMPLETE" ? "SOLD" : "RESERVED"}
                          </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {resvPageItems.length === 0 && (
                                        <tr>
                                            <td className="py-6 px-4 text-center text-sm text-gray-500" colSpan={8}>
                                                No reservations found.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-white rounded-b-lg shadow-sm">
                            <PaginationControls
                                currentPage={resvPage}
                                totalPages={resvTotalPages}
                                onPageChange={setResvPage}
                                showPageNumbers
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DetailModal open={openDetail} onClose={() => setOpenDetail(false)} event={item} />
            <OrganizerDetailModal
                open={openOrganizerDetail}
                onClose={() => setOpenOrganizerDetail(false)}
                organizerId={item?.organizerId}
            />
        </div>
    );
}
