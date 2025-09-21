"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { ChevronRight, X, Check, AlertTriangle, Clock } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryRadio from "@/components/CategoryRadio";
import poster1 from "@/assets/poster.png";

/* ==============================
   Mock pending events data
   ============================== */
const pendingEvents = [
  {
    id: "PE001",
    title: "SUMMER JAZZ FESTIVAL 2025",
    category: "Concert",
    organizer: "THAI TICKET MAJOR",
    organizerDetails: {
      name: "THAI TICKET MAJOR",
      phone: "+66 (0) 2-262-3456",
      email: "contact@thaiticketmajor.com",
      address:
        "999/9 The Offices at CentralWorld, 17th Floor, Rama I Road, Pathumwan, Bangkok 10330",
    },
    showDates: ["15 March 2025", "16 March 2025"],
    ticketAllowPerson: "4 Tickets per Person",
    location: "Impact Arena, Muang Thong Thani",
    salePeriod: "1 February 2025 - 10 March 2025",
    poster: poster1,
    description:
      "A spectacular summer jazz festival featuring international and local artists performing across multiple stages with food and beverage vendors.",
    submittedDate: "20 Jan 2025",
    status: "pending",
    estimatedAttendees: "15,000",
    ticketPrice: "1,500 - 5,000 THB",
  },
  {
    id: "PE002",
    title: "TECH CONFERENCE BANGKOK",
    category: "Conference",
    organizer: "EVENT PRO CO.",
    organizerDetails: {
      name: "EVENT PRO CO.",
      phone: "+66 (0) 2-555-1234",
      email: "info@eventpro.co.th",
      address: "123 Business Park, Sukhumvit Road, Bangkok 10110",
    },
    showDates: ["10 April 2025"],
    ticketAllowPerson: "2 Tickets per Person",
    location: "Queen Sirikit National Convention Center",
    salePeriod: "15 February 2025 - 5 April 2025",
    poster: poster1,
    description:
      "Annual technology conference featuring keynote speakers, workshops, and networking sessions for tech professionals.",
    submittedDate: "18 Jan 2025",
    status: "pending",
    estimatedAttendees: "2,500",
    ticketPrice: "2,000 - 8,000 THB",
  },
  {
    id: "PE003",
    title: "FOOD & WINE EXPO",
    category: "Exhibition",
    organizer: "EXPO THAILAND",
    organizerDetails: {
      name: "EXPO THAILAND",
      phone: "+66 (0) 2-777-9999",
      email: "contact@expothailand.com",
      address: "456 Exhibition Center, Ratchada Road, Bangkok 10400",
    },
    showDates: ["5 May 2025", "6 May 2025", "7 May 2025"],
    ticketAllowPerson: "6 Tickets per Person",
    location: "BITEC Bangna",
    salePeriod: "1 March 2025 - 1 May 2025",
    poster: poster1,
    description:
      "Premier food and wine exhibition showcasing local and international cuisine, cooking demonstrations, and wine tastings.",
    submittedDate: "15 Jan 2025",
    status: "under_review",
    estimatedAttendees: "8,000",
    ticketPrice: "500 - 1,200 THB",
  },
];

type PendingEvent = typeof pendingEvents[number];
type StatusFilter = "all" | "pending" | "under_review";

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
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="sr-only">Next</span>
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
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
   Event Detail Modal (without Submitted Documents)
   ============================== */
function EventDetailModal({
  open,
  onClose,
  event,
}: {
  open: boolean;
  onClose: () => void;
  event: PendingEvent | null;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !event) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

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
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex justify-center lg:justify-start">
                  <img
                    src={event.poster}
                    alt={event.title}
                    className="w-72 h-96 object-cover rounded-xl shadow-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="block text-xs font-medium text-gray-500 mb-1">
                        Category
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {event.category}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="block text-xs font-medium text-gray-500 mb-1">
                        Status
                      </span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {event.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="block text-xs font-medium text-gray-500 mb-1">
                        Estimated Attendees
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {event.estimatedAttendees}
                      </span>
                    </div>
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <span className="block text-xs font-medium text-gray-500 mb-1">
                        Ticket Price
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {event.ticketPrice}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <span className="block text-xs font-medium text-gray-500 mb-2">
                      Show Dates
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {event.showDates.map((date, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium"
                        >
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <span className="block text-xs font-medium text-gray-500 mb-1">
                      Sale Period
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {event.salePeriod}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <span className="block text-xs font-medium text-gray-500 mb-1">
                      Location
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {event.location}
                    </span>
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
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>

            {/* Organizer */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-1 h-5 bg-green-500 rounded-full" />
                Organizer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">
                    Organization
                  </span>
                  <span className="text-gray-900 font-medium">
                    {event.organizerDetails.name}
                  </span>
                </div>
                <div>
                  <span className="block text-sm font-medium text-gray-500 mb-1">
                    Phone
                  </span>
                  <span className="text-gray-900 font-medium">
                    {event.organizerDetails.phone}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-sm font-medium text-gray-500 mb-1">
                    Email
                  </span>
                  <span className="text-gray-900 font-medium">
                    {event.organizerDetails.email}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="block text-sm font-medium text-gray-500 mb-1">
                    Address
                  </span>
                  <span className="text-gray-900 font-medium">
                    {event.organizerDetails.address}
                  </span>
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
}: {
  open: boolean;
  onClose: () => void;
  event: PendingEvent | null;
  action: "approve" | "reject" | null;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !event || !action) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const isApprove = action === "approve";

  const handleSubmit = () => {
    // TODO: call API approve/reject
    console.log(`${action} event ${event.id}`, { reason });
    onClose();
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
        onClick={stop}
      >
        <div
          className={`px-6 py-4 border-b ${
            isApprove ? "bg-green-50" : "bg-red-50"
          }`}
        >
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
              placeholder={
                isApprove
                  ? "Add any notes or conditions..."
                  : "Please specify the reason for rejection..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
              required={!isApprove}
            />
          </div>
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
            disabled={!isApprove && !reason.trim()}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              isApprove
                ? "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                : "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
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
   AdminEventPermission (Main Component)
   ============================== */
export default function AdminEventPermission() {
  // State: filter/search
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // State: modals
  const [selectedEvent, setSelectedEvent] = useState<PendingEvent | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"approve" | "reject" | null>(null);

  // State: pagination
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  // Filtering
  const filteredEvents = useMemo(() => {
    let list = pendingEvents;

    if (statusFilter !== "all") {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((e) =>
        [e.id, e.title, e.organizer, e.category, e.location, e.salePeriod, e.submittedDate]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [query, statusFilter]);

  // Pagination derive
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredEvents.slice(start, start + PAGE_SIZE);
  }, [filteredEvents, page]);

  useEffect(() => {
    // reset to first page when filter/search changes
    setPage(1);
  }, [query, statusFilter]);

  // Handlers
  const handleRowClick = (ev: PendingEvent) => {
    setSelectedEvent(ev);
    setDetailModalOpen(true);
  };

  const handleApprove = (e: React.MouseEvent, ev: PendingEvent) => {
    e.stopPropagation(); // Prevent row click
    setSelectedEvent(ev);
    setPendingAction("approve");
    setActionModalOpen(true);
  };

  const handleReject = (e: React.MouseEvent, ev: PendingEvent) => {
    e.stopPropagation(); // Prevent row click
    setSelectedEvent(ev);
    setPendingAction("reject");
    setActionModalOpen(true);
  };

  // Badges
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

  // Filter options
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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-0">
          <div className="bg-white rounded-t-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Pending Events: {filteredEvents.length}</h2>
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
                      <td className="py-3 px-4 text-gray-800 font-mono text-sm">
                        {ev.id}
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        <div className="flex items-center gap-3">
                          <img
                            src={ev.poster}
                            alt={ev.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{ev.title}</span>
                            <span className="text-xs text-gray-500 line-clamp-1">
                              {ev.location}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-800">{ev.category}</td>
                      <td className="py-3 px-4 text-gray-800">{ev.organizer}</td>
                      <td className="py-3 px-4 text-gray-800">
                        <span className="text-sm">
                          {ev.showDates.join(", ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-800">
                        {ev.submittedDate}
                      </td>
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
                      <td
                        className="py-12 px-4 text-center text-sm text-gray-500"
                        colSpan={8}
                      >
                        <div className="flex flex-col items-center gap-3">
                          <AlertTriangle className="h-10 w-10 text-gray-400" />
                          No events found matching your criteria.
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
              onPageChange={setPage}
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
      />
    </div>
  );
}