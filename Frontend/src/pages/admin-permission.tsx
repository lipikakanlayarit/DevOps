"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { X, Check, AlertTriangle } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryRadio from "@/components/CategoryRadio";
import { api } from "@/lib/api"; // <-- ใช้ axios instance ของโปรเจกต์คุณ

type StatusFilter = "all" | "pending" | "under_review";
type ServerStatus = "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED" | string;

type ApiEvent = {
    // ปรับให้ครอบคลุมชื่อฟิลด์จาก backend
    event_id?: number;        // events_nam.event_id (จาก DB จริง)
    id?: number | string;     // เผื่อ backend ส่งเป็น id
    event_name?: string;
    title?: string;
    category_id?: number;
    category_name?: string;
    organizer_id?: number;
    organizer?: string;
    start_datetime?: string;
    end_datetime?: string;
    venue_name?: string;
    venue_address?: string;
    status?: ServerStatus;    // PENDING/APPROVED/REJECTED...
    created_at?: string;
    submittedDate?: string;   // เผื่อเคยตั้งแบบนี้
    poster?: string;          // ถ้ามี
};

type UiEvent = {
    id: string;
    title: string;
    category: string;
    organizer: string;
    showDates: string[];
    location: string;
    submittedDate: string;
    status: "pending" | "under_review" | string;
    poster?: string | null;
};

const PAGE_SIZE = 8;

/** แปลงข้อมูลจาก API → รูปแบบที่หน้า UI ต้องใช้ */
function mapEvent(e: ApiEvent): UiEvent {
    const id =
        (e.event_id != null ? String(e.event_id) : e.id != null ? String(e.id) : "");
    const title = e.event_name || e.title || "(untitled)";
    const category = e.category_name || (e.category_id ? `#${e.category_id}` : "—");
    const organizer = e.organizer || (e.organizer_id ? `Organizer#${e.organizer_id}` : "—");
    const showDates = [e.start_datetime, e.end_datetime].filter(Boolean).map(s => new Date(s!).toLocaleString());
    const location = e.venue_name || e.venue_address || "—";

    // แมปสถานะจากฝั่ง server → ตัวกรองหน้า UI
    // - PENDING -> "pending"
    // - (ถ้ามีสถานะกำลังตรวจ) ให้แมปเป็น "under_review" ตาม UI
    const statusUpper = (e.status || "").toUpperCase();
    const uiStatus =
        statusUpper === "PENDING" ? "pending"
            : statusUpper === "UNDER_REVIEW" ? "under_review"
                : statusUpper;

    const submitted =
        e.submittedDate ||
        e.created_at ||
        ""; // ถ้า backend ไม่มี ก็แสดงว่าง

    return {
        id,
        title,
        category,
        organizer,
        showDates: showDates.length ? showDates : ["—"],
        location,
        submittedDate: submitted,
        status: uiStatus,
        poster: e.poster ?? null,
    };
}

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

                    <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                    >
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
   Modals (ตัดส่วนที่ไม่จำเป็นออก เหลือ confirm)
   ============================== */

function EventDetailModal({
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

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/80">
                        <X className="h-6 w-6 text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Category</div>
                            <div className="font-medium">{event.category}</div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 mb-1">Status</div>
                            <div className="font-medium capitalize">{event.status.replace("_", " ")}</div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-xs text-gray-500 mb-1">Show Dates</div>
                            <div className="flex flex-wrap gap-1">
                                {event.showDates.map((d, i) => (
                                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {d}
                  </span>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="text-xs text-gray-500 mb-1">Location</div>
                            <div className="font-medium">{event.location}</div>
                        </div>
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

function PermissionActionModal({
                                   open,
                                   onClose,
                                   event,
                                   action,
                                   onDone,
                               }: {
    open: boolean;
    onClose: () => void;
    event: UiEvent | null;
    action: "approve" | "reject" | null;
    onDone: () => void;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open || !event || !action) return null;

    const isApprove = action === "approve";

    const handleSubmit = async () => {
        try {
            // เรียกจริงไป backend
            if (isApprove) {
                await api.post(`/admin/events/${event.id}/approve`);
            } else {
                await api.post(`/admin/events/${event.id}/reject`);
            }
            onClose();
            onDone(); // refresh list
        } catch (err) {
            console.error(err);
            alert("ทำรายการไม่สำเร็จ");
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`px-6 py-4 border-b ${isApprove ? "bg-green-50" : "bg-red-50"}`}>
                    <h3 className="text-xl font-bold text-gray-900">
                        {isApprove ? "Approve Event" : "Reject Event"}
                    </h3>
                </div>

                <div className="p-6">
                    <p className="text-gray-700">
                        คุณต้องการ<strong className="mx-1 uppercase">{action}</strong>
                        อีเวนต์ “<span className="font-semibold">{event.title}</span>” ใช่ไหม?
                    </p>
                    <p className="text-gray-500 text-sm mt-2">*ไม่ต้องกรอกเหตุผล</p>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`px-4 py-2 text-sm rounded-md font-medium ${
                            isApprove ? "bg-green-600 text-white hover:bg-green-700" : "bg-red-600 text-white hover:bg-red-700"
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
    // State: filter/search
    const [query, setQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    // State: modals
    const [selectedEvent, setSelectedEvent] = useState<UiEvent | null>(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [actionModalOpen, setActionModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

    // Data + pagination
    const [rows, setRows] = useState<UiEvent[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = PAGE_SIZE;
    const statusParam = statusFilter === "all" ? undefined : statusFilter;

    const fetchList = async (opts?: { page?: number }) => {
        const p = opts?.page ?? page;
        try {
            // ปรับพารามให้ตรงกับ backend ของคุณ
            const { data } = await api.get("/admin/events", {
                params: {
                    status: statusParam, // คาดหวังว่า backend map 'pending' → PENDING เองได้
                    q: query || undefined,
                    page: p - 1,         // ถ้า backend นับจาก 0
                    size: pageSize,
                },
            });

            // รองรับทั้งแบบ page object และ array ธรรมดา
            const items: ApiEvent[] = Array.isArray(data?.content) ? data.content
                : Array.isArray(data) ? data
                    : Array.isArray(data?.items) ? data.items
                        : [];
            const mapped = items.map(mapEvent);
            setRows(mapped);

            const tp =
                typeof data?.totalPages === "number"
                    ? Math.max(1, data.totalPages)
                    : typeof data?.total_pages === "number"
                        ? Math.max(1, data.total_pages)
                        : // ถ้า backend ไม่ส่งรวมหน้า ก็ประเมินจากจำนวน item (กรณี simple list)
                        Math.max(1, Math.ceil(mapped.length / pageSize));
            setTotalPages(tp);
            setPage(p);
        } catch (err) {
            console.error(err);
            setRows([]);
            setTotalPages(1);
        }
    };

    // เมื่อเปลี่ยนเงื่อนไข ให้โหลดหน้า 1 ใหม่
    useEffect(() => {
        fetchList({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, statusFilter]);

    const pageItems = rows; // เพราะใช้ server-side paging

    // Handlers
    const handleRowClick = (ev: UiEvent) => {
        setSelectedEvent(ev);
        setDetailModalOpen(true);
    };
    const handleApprove = (e: React.MouseEvent, ev: UiEvent) => {
        e.stopPropagation();
        setSelectedEvent(ev);
        setPendingAction("approve");
        setActionModalOpen(true);
    };
    const handleReject = (e: React.MouseEvent, ev: UiEvent) => {
        e.stopPropagation();
        setSelectedEvent(ev);
        setPendingAction("reject");
        setActionModalOpen(true);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pending
          </span>
                );
            case "under_review":
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Under Review
          </span>
                );
            default:
                return (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
                );
        }
    };

    const statusOptions = [
        { label: "All Status", value: "all" },
        { label: "Pending", value: "pending" },
        { label: "Under Review", value: "under_review" },
    ];

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
                            <SearchBar
                                value={query}
                                onChange={setQuery}
                                width="w-[300px] md:w-[360px]"
                                height="h-11"
                                placeholder="Search events..."
                            />
                        </div>
                    </div>
                </div>

                {/* TABLE VIEW */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="bg-white rounded-t-lg shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                Pending Events
                            </h2>
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
                                                {/* ถ้าอยากโชว์รูปจริงค่อยไปดึง cover จาก /api/events/{id}/cover */}
                                                <div className="w-10 h-10 rounded bg-gray-100" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{ev.title}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1">{ev.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-gray-800">{ev.category}</td>
                                        <td className="py-3 px-4 text-gray-800">{ev.organizer}</td>
                                        <td className="py-3 px-4 text-gray-800">
                                            <span className="text-sm">{ev.showDates.join(", ")}</span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-800">{ev.submittedDate || "—"}</td>
                                        <td className="py-3 px-4">{getStatusBadge(ev.status)}</td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleApprove(e, ev)}
                                                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={(e) => handleReject(e, ev)}
                                                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {pageItems.length === 0 && (
                                    <tr>
                                        <td className="py-12 px-4 text-center text-sm text-gray-500" colSpan={8}>
                                            <div className="flex flex-col items-center gap-3">
                                                <AlertTriangle className="h-10 w-10 text-gray-400" />
                                                No events found.
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="bg-white rounded-b-lg shadow-sm">
                        <PaginationControls
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={(p) => fetchList({ page: p })}
                            showPageNumbers
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EventDetailModal
                open={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                event={selectedEvent}
            />
            <PermissionActionModal
                open={actionModalOpen}
                onClose={() => setActionModalOpen(false)}
                event={selectedEvent}
                action={pendingAction}
                onDone={() => fetchList({ page })}
            />
        </div>
    );
}
