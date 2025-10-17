// src/pages/admin-permission.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { X, Check, AlertTriangle } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryRadio from "@/components/CategoryRadio";
import { api } from "@/lib/api";
import posterFallback from "@/assets/poster.png";
import AuthImage from "@/components/AuthImage";

/* ==============================
   Types
   ============================== */
type StatusFilter = "all" | "pending" | "approved" | "rejected";

type EventRow = {
    id: number | string;
    title: string;
    category: string;
    categoryId?: number;
    organizer?: string;
    startDateTime?: string;
    endDateTime?: string;
    submittedDate?: string;
    status: "pending" | "approved" | "rejected";
    location?: string;
    description?: string;
};

/* ==============================
   Helpers
   ============================== */
const categoryLabel = (id?: number | null) => {
    if (id === 1) return "Concert";
    if (id === 2) return "Seminar";
    if (id === 3) return "Exhibition";
    return "Other";
};

const fmtDate = (iso?: string) => {
    if (!iso) return "-";
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
};

// path สำหรับโหลด cover ผ่าน axios (แนบ token)
const coverPath = (id: number | string, updatedAt?: string) =>
    `/admin/events/${id}/cover${updatedAt ? `?v=${encodeURIComponent(updatedAt)}` : ""}`;

/* ==============================
   Pagination Controls (cleaned)
   ============================== */
const PaginationControls = ({
                                currentPage,
                                totalPages,
                                onPageChange,
                            }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (p: number) => void;
}) => {
    const maxVisiblePages = 5;

    const visiblePages = React.useMemo(() => {
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
    }, [currentPage, totalPages]);

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

                        {/* first + dots */}
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

                        {/* numbers */}
                        {visiblePages.map((n) => (
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

                        {/* dots + last */}
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
   Event Detail Modal
   ============================== */
function EventDetailModal({
                              open,
                              onClose,
                              event,
                          }: {
    open: boolean;
    onClose: () => void;
    event: EventRow | null;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open || !event) return null;
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    const src = coverPath(event.id, event.submittedDate);

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={stop}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        {event.title}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/80 transition-colors duration-200">
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="flex justify-center lg:justify-start">
                                    <AuthImage
                                        src={src}
                                        alt={event.title}
                                        fallback={posterFallback}
                                        className="w-72 h-96 object-cover rounded-xl shadow-lg"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <span className="block text-xs font-medium text-gray-500 mb-1">Category</span>
                                            <span className="text-sm font-semibold text-gray-900">{event.category}</span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <span className="block text-xs font-medium text-gray-500 mb-1">Status</span>
                                            <span className="text-sm font-semibold text-gray-900 capitalize">{event.status}</span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <span className="block text-xs font-medium text-gray-500 mb-1">Start</span>
                                            <span className="text-sm font-semibold text-gray-900">{fmtDate(event.startDateTime)}</span>
                                        </div>
                                        <div className="bg-white rounded-lg p-3 shadow-sm">
                                            <span className="block text-xs font-medium text-gray-500 mb-1">End</span>
                                            <span className="text-sm font-semibold text-gray-900">{fmtDate(event.endDateTime)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <span className="block text-xs font-medium text-gray-500 mb-1">Location</span>
                                        <span className="text-sm font-semibold text-gray-900">{event.location || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <div className="w-1 h-5 bg-blue-500 rounded-full" />
                                Event Description
                            </h4>
                            <p className="text-gray-700 leading-relaxed">{event.description || "-"}</p>
                        </div>

                        {/* Organizer */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border">
                            <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <div className="w-1 h-5 bg-green-500 rounded-full" />
                                Organizer Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 mb-1">Organization</span>
                                    <span className="text-gray-900 font-medium">{event.organizer || "-"}</span>
                                </div>
                                <div>
                                    <span className="block text-sm font-medium text-gray-500 mb-1">Submitted / Updated At</span>
                                    <span className="text-gray-900 font-medium">{fmtDate(event.submittedDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
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

/* ==============================
   Permission Action Modal
   ============================== */
function PermissionActionModal({
                                   open,
                                   onClose,
                                   event,
                                   action,
                                   onSubmit,
                               }: {
    open: boolean;
    onClose: () => void;
    event: EventRow | null;
    action: "approve" | "reject" | null;
    onSubmit: (payload: { id: number | string; review: string; action: "approve" | "reject" }) => void;
}) {
    const [reason, setReason] = useState("");

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (open) setReason("");
    }, [open]);

    if (!open || !event || !action) return null;

    const stop = (e: React.MouseEvent) => e.stopPropagation();
    const isApprove = action === "approve";

    const handleSubmit = () => onSubmit({ id: event.id, review: reason.trim(), action });

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={stop}>
                <div className={`px-6 py-4 border-b ${isApprove ? "bg-green-50" : "bg-red-50"}`}>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        {isApprove ? (
                            <>
                                <Check className="h-5 w-5 text-green-600" />
                                Approve Event
                            </>
                        ) : (
                            <>
                                <X className="h-5 w-5 text-red-600" />
                                Reject Event
                            </>
                        )}
                    </h3>
                </div>

                <div className="p-6">
                    <p className="text-gray-700 mb-4">
                        Are you sure you want to <strong>{action}</strong> "{event.title}"?
                    </p>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {isApprove ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={isApprove ? "Add any notes or conditions..." : "Please specify the reason for rejection..."}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            rows={4}
                            required={!isApprove}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50">
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isApprove && !reason.trim()}
                        className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                            isApprove ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" : "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                        }`}
                    >
                        {isApprove ? "Approve" : "Reject"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ==============================
   Main Component
   ============================== */
export default function AdminEventPermission() {
    // Filters
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");

    // List & UI
    const [items, setItems] = useState<EventRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

    // Pagination
    const PAGE_SIZE = 8;
    const [page, setPage] = useState(1);

    const statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
    ];

    const getBackendStatus = (st: StatusFilter) =>
        st === "pending" ? "PENDING" : st === "approved" ? "APPROVED" : st === "rejected" ? "REJECTED" : "PENDING";

    const mapStatusToUi = (s?: string) => {
        const up = (s || "").toUpperCase();
        if (up === "APPROVED") return "approved" as const;
        if (up === "REJECTED") return "rejected" as const;
        return "pending" as const;
    };

    const load = async (st: StatusFilter) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get("/admin/events", { params: { status: getBackendStatus(st) } });
            const data: any[] = Array.isArray(res.data) ? res.data : [];
            const mapped: EventRow[] = data.map((it) => ({
                id: it.id ?? it.eventId ?? it.event_id,
                title: it.eventName ?? it.name ?? "-",
                category: categoryLabel(it.categoryId),
                categoryId: it.categoryId,
                organizer: it.organizerName ?? it.organizer ?? "-",
                startDateTime: it.startDateTime,
                endDateTime: it.endDateTime,
                submittedDate: it.updatedAt || it.startDateTime,
                status: mapStatusToUi(it.status),
                location: it.venueName,
                description: it.description,
            }));
            setItems(mapped);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || "โหลดข้อมูลไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load(statusFilter);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

    const filteredEvents = useMemo(() => {
        let list = items;
        if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((e) =>
                [
                    e.id,
                    e.title,
                    e.organizer || "",
                    e.category,
                    e.location || "",
                    e.submittedDate || "",
                    e.startDateTime || "",
                    e.endDateTime || "",
                ]
                    .join(" ")
                    .toLowerCase()
                    .includes(q)
            );
        }
        return list;
    }, [items, statusFilter, query]);

    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
    const pageItems = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredEvents.slice(start, start + PAGE_SIZE);
    }, [filteredEvents, page]);

    useEffect(() => {
        setPage(1);
    }, [query, statusFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
            case "approved":
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
            case "rejected":
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const handleRowClick = (ev: EventRow) => {
        setSelectedEvent(ev);
        setDetailModalOpen(true);
    };

    const handleApprove = (e: React.MouseEvent, ev: EventRow) => {
        e.stopPropagation();
        setSelectedEvent(ev);
        setPendingAction("approve");
        setActionModalOpen(true);
    };

    const handleReject = (e: React.MouseEvent, ev: EventRow) => {
        e.stopPropagation();
        setSelectedEvent(ev);
        setPendingAction("reject");
        setActionModalOpen(true);
    };

    const submitAction = async ({
                                    id,
                                    review,
                                    action,
                                }: {
        id: number | string;
        review: string;
        action: "approve" | "reject";
    }) => {
        try {
            if (action === "approve") {
                await api.post(`/admin/events/${id}/approve`, { review });
            } else {
                if (!review.trim()) {
                    alert("กรุณากรอกเหตุผลก่อนปฏิเสธ");
                    return;
                }
                await api.post(`/admin/events/${id}/reject`, { review });
            }
            setItems((prev) => prev.filter((x) => x.id !== id));
            setActionModalOpen(false);
        } catch (e: any) {
            alert(e?.response?.data?.message || e?.message || "ดำเนินการไม่สำเร็จ");
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen">
            <Sidebar />

            <div className="ml-64 flex flex-col">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-200 bg-gray-100">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-900">Event Permission</h1>
                        <div className="flex items-center gap-3">
                            <CategoryRadio
                                options={statusOptions}
                                value={statusFilter}
                                onChange={(val) => setStatusFilter(val as StatusFilter)}
                            />
                            <SearchBar value={query} onChange={setQuery} width="w-[300px] md:w-[360px]" height="h-11" placeholder="Search events..." />
                        </div>
                    </div>
                </div>

                {/* TABLE VIEW */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-0">
                    <div className="mb-4 p-3 rounded-xl bg-white border text-sm text-gray-600 inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Approve = เปลี่ยนสถานะเป็น Approved, Reject = ต้องกรอกเหตุผล</span>
                    </div>

                    <div className="bg-white rounded-t-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">Events: {filteredEvents.length}</h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">ID</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">TITLE</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">CATEGORY</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">ORGANIZER</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">DATES</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">SUBMITTED</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">STATUS</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">ACTIONS</th>
                                </tr>
                                </thead>
                                <tbody>
                                {pageItems.map((ev) => (
                                    <tr
                                        key={ev.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleRowClick(ev)}
                                    >
                                        <td className="py-3 px-4 text-gray-800 font-mono text-sm">{ev.id}</td>
                                        <td className="py-3 px-4 text-gray-800">
                                            <div className="flex items-center gap-3">
                                                <AuthImage
                                                    src={coverPath(ev.id, ev.submittedDate)}
                                                    alt={ev.title}
                                                    fallback={posterFallback}
                                                    className="w-10 h-10 rounded object-cover"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ev.title}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1">{ev.location || "-"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-800">{ev.category}</td>
                                        <td className="py-3 px-4 text-gray-800">{ev.organizer || "-"}</td>
                                        <td className="py-3 px-4 text-gray-800">
                        <span className="text-sm">
                          {fmtDate(ev.startDateTime)}
                            {ev.endDateTime ? ` → ${fmtDate(ev.endDateTime)}` : ""}
                        </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-800">{fmtDate(ev.submittedDate)}</td>
                                        <td className="py-3 px-4">{getStatusBadge(ev.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => handleApprove(e, ev)} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700">
                                                    Approve
                                                </button>
                                                <button onClick={(e) => handleReject(e, ev)} className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700">
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {pageItems.length === 0 && !loading && (
                                    <tr>
                                        <td className="py-12 px-4 text-center text-sm text-gray-500" colSpan={8}>
                                            <div className="flex flex-col items-center gap-3">
                                                <AlertTriangle className="h-10 w-10 text-gray-400" />
                                                No events found matching your criteria.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {loading && (
                                    <tr>
                                        <td className="py-8 px-4 text-center text-sm text-gray-500" colSpan={8}>
                                            Loading...
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mt-3 px-4 py-3 rounded-lg border border-red-300 bg-red-50 text-red-800">
                            {error}
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="bg-white rounded-b-lg shadow-sm">
                        <PaginationControls currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EventDetailModal open={detailModalOpen} onClose={() => setDetailModalOpen(false)} event={selectedEvent} />
            <PermissionActionModal
                open={actionModalOpen}
                onClose={() => setActionModalOpen(false)}
                event={selectedEvent}
                action={pendingAction}
                onSubmit={submitAction}
            />
        </div>
    );
}
