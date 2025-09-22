"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "@/components/sidebar";
import { ChevronRight, X } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryRadio from "@/components/CategoryRadio";
import OutlineButton from "@/components/OutlineButton";
import poster from "@/assets/poster.png";

// === Mock event data ===
const eventData = {
  id: "1",
  title: "ROBERT BALTAZAR TRIO",
  category: "Concert",
  organizer: "THAI TICKET MAJOR",
  organizerDetails: {
    name: "THAI TICKET MAJOR",
    phone: "+66 (0) 2-262-3456",
    email: "contact@thaiticketmajor.com",
    address: "999/9 The Offices at CentralWorld, 17th Floor, Rama I Road, Pathumwan, Bangkok 10330"
  },
  showDates: ["12 January 2025", "13 January 2025"],
  ticketAllowPerson: "1 Ticket per Person",
  location: "MCC HALL, 3rd Floor, The Mall Lifestore Bangkapi",
  salePeriod: "1 December 2024 - 10 January 2025",
  poster: poster,
  description:
    "An intimate jazz night with Robert Baltazar Trio — expressive piano, warm double-bass, and tasteful percussion. Expect modern standards, originals, and collaborative improvisation throughout a 90-minute set.",
  ticketZones: [
    { zone: "VIP zone", row: 12, column: 6, sale: "50/30", price: "Price/ticket" },
    { zone: "zone A", row: 12, column: 6, sale: "50/30", price: "Price/ticket" },
    { zone: "Standard zone", row: 12, column: 6, sale: "50/30", price: "Price/ticket" },
    { zone: "VIP zone", row: 12, column: 6, sale: "50/30", price: "Price/ticket" },
    { zone: "zone A", row: 12, column: 6, sale: "50/30", price: "Price/ticket" },
    { zone: "Standard zone", row: 12, column: 6, sale: "50/30", price: "Price/ticket" },
  ],
  seatStats: { available: 40, reserved: 12, sold: 8 },
  reservations: [
    { id: "810100125892500", seatId: "B12", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "15 Dec 2024", paymentMethod: "Credit Card" },
    { id: "810100125892501", seatId: "B13", total: "5,000", user: "ZOMBIE", status: "UNPAID", date: "16 Dec 2024", paymentMethod: "Bank Transfer" },
    { id: "810100125892502", seatId: "B14", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "17 Dec 2024", paymentMethod: "Credit Card" },
    { id: "810100125892503", seatId: "B15", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "18 Dec 2024", paymentMethod: "QR Payment" },
    { id: "810100125892504", seatId: "B16", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "19 Dec 2024", paymentMethod: "Credit Card" },
    { id: "810100125892505", seatId: "B17", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "20 Dec 2024", paymentMethod: "Bank Transfer" },
    { id: "810100125892506", seatId: "B18", total: "5,000", user: "ZOMBIE", status: "UNPAID", date: "21 Dec 2024", paymentMethod: "QR Payment" },
    { id: "810100125892507", seatId: "B19", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "22 Dec 2024", paymentMethod: "Credit Card" },
    { id: "810100125892508", seatId: "B20", total: "5,000", user: "ZOMBIE", status: "UNPAID", date: "23 Dec 2024", paymentMethod: "Bank Transfer" },
    { id: "810100125892509", seatId: "B21", total: "5,000", user: "ZOMBIE", status: "COMPLETE", date: "24 Dec 2024", paymentMethod: "QR Payment" },
    { id: "810100125892510", seatId: "B22", total: "5,000", user: "ZOMBIE", status: "UNPAID", date: "25 Dec 2024", paymentMethod: "Credit Card" },
  ],
};

type Resv = typeof eventData.reservations[number];
const isSold = (r: Resv) => r.status === "COMPLETE";
const isReserved = (r: Resv) => !isSold(r);
type ResvFilter = "all" | "reserved" | "sold";

// ========== Pagination Controls ==========
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
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
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
            {showPageNumbers && visiblePages.map((n) => (
              <button
                key={n}
                onClick={() => onPageChange(n)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === n
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
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

// ========== Organizer Detail Modal ==========
function OrganizerDetailModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // ปิดด้วยปุ่ม Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

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
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-green-50 to-emerald-50">
          <h3 id="organizer-detail-title" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Organizer Info Card */}
            <div className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                {eventData.organizerDetails.name}
              </h4>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="block text-sm font-medium text-gray-500 mb-1">Phone Number</span>
                  <span className="text-lg font-semibold text-gray-900">{eventData.organizerDetails.phone}</span>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="block text-sm font-medium text-gray-500 mb-1">Email</span>
                  <span className="text-lg font-semibold text-gray-900">{eventData.organizerDetails.email}</span>
                </div>
                
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <span className="block text-sm font-medium text-gray-500 mb-1">Address</span>
                  <span className="text-lg font-semibold text-gray-900 leading-relaxed">{eventData.organizerDetails.address}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ========== Detail Modal ==========
function DetailModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  // ปิดด้วยปุ่ม Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

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
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 id="event-detail-title" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            {eventData.title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Event Overview Card */}
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="flex justify-center lg:justify-start">
                  <img
                    src={eventData.poster || "/placeholder.svg"}
                    alt={eventData.title}
                    className="w-72 h-96 object-cover rounded-xl shadow-lg"
                  />
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <span className="block text-sm font-medium text-gray-500 mb-1">Category</span>
                      <span className="text-lg font-semibold text-gray-900">{eventData.category}</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <span className="block text-sm font-medium text-gray-500 mb-1">Organizer</span>
                      <span className="text-lg font-semibold text-gray-900">{eventData.organizer}</span>
                    </div>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <span className="block text-sm font-medium text-gray-500 mb-1">Ticket Limit</span>
                      <span className="text-lg font-semibold text-gray-900">{eventData.ticketAllowPerson}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="block text-sm font-medium text-gray-500 mb-2">Show Dates</span>
                    <div className="flex flex-wrap gap-2">
                      {eventData.showDates.map((date, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                          {date}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="block text-sm font-medium text-gray-500 mb-1">Sale Period</span>
                    <span className="text-lg font-semibold text-gray-900">{eventData.salePeriod}</span>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <span className="block text-sm font-medium text-gray-500 mb-1">Location</span>
                    <span className="text-lg font-semibold text-gray-900">{eventData.location}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h4 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                Event Description
              </h4>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {eventData.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <OutlineButton onClick={onClose}>Close</OutlineButton>
        </div>
      </div>
    </div>
  );
}

export default function AdminEventdetail() {
  const { id } = useParams<{ id?: string }>();

  // ===== NEW: modal states =====
  const [openDetail, setOpenDetail] = useState(false);
  const [openOrganizerDetail, setOpenOrganizerDetail] = useState(false);

  // ===== reservations toolbar state =====
  const [query, setQuery] = useState("");
  const [resvFilter, setResvFilter] = useState<ResvFilter>("all");

  // ===== pagination state =====
  const TICKETZONE_PAGE_SIZE = 5;
  const RESV_PAGE_SIZE = 10;

  const [tzPage, setTzPage] = useState(1);
  const [resvPage, setResvPage] = useState(1);

  // ===== derived: ticket zones pagination =====
  const tzTotalPages = Math.max(1, Math.ceil(eventData.ticketZones.length / TICKETZONE_PAGE_SIZE));
  const tzPageItems = useMemo(() => {
    const start = (tzPage - 1) * TICKETZONE_PAGE_SIZE;
    return eventData.ticketZones.slice(start, start + TICKETZONE_PAGE_SIZE);
  }, [tzPage]);

  useEffect(() => {
    setTzPage(1);
  }, []);

  // ===== derived: reservations filter + search + pagination =====
  const filteredReservations = useMemo(() => {
    let list = eventData.reservations;
    if (resvFilter === "sold") list = list.filter(isSold);
    if (resvFilter === "reserved") list = list.filter(isReserved);

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((r) =>
        [r.id, r.seatId, r.total, r.user, r.status, r.date, r.paymentMethod]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [query, resvFilter]);

  const resvTotalPages = Math.max(1, Math.ceil(filteredReservations.length / RESV_PAGE_SIZE));
  const resvPageItems = useMemo(() => {
    const start = (resvPage - 1) * RESV_PAGE_SIZE;
    return filteredReservations.slice(start, start + RESV_PAGE_SIZE);
  }, [filteredReservations, resvPage]);

  useEffect(() => {
    setResvPage(1);
  }, [query, resvFilter]);

  // CategoryRadio options
  const resvFilterOptions = [
    { label: "All", value: "all" },
    { label: "Reserved", value: "reserved" },
    { label: "Sold", value: "sold" },
  ];

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
              aria-label="Back to All Event (admin)"
            >
              All Event
            </Link>
            <ChevronRight className="mx-2 h-5 w-5 text-gray-500" />
            <span className="truncate">
              {eventData.title}
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
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={eventData.poster || "/placeholder.svg"}
                    alt={eventData.title}
                    className="w-40 h-56 object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <h1 className="text-2xl font-bold text-gray-800">{eventData.title}</h1>

                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">Category:</span><span className="ml-2 text-gray-800">{eventData.category}</span></div>
                    <div><span className="text-gray-500">Organizer:</span><span className="ml-2 text-gray-800">{eventData.organizer}</span></div>
                    <div><span className="text-gray-500">Show Date:</span><span className="ml-2 text-gray-800">{eventData.showDates.join(", ")}</span></div>
                    <div><span className="text-gray-500">Sale Period:</span><span className="ml-2 text-gray-800">{eventData.salePeriod}</span></div>
                    <div><span className="text-gray-500">Ticket Allow Person:</span><span className="ml-2 text-gray-800">{eventData.ticketAllowPerson}</span></div>
                    <div><span className="text-gray-500">Location:</span><span className="ml-2 text-gray-800">{eventData.location}</span></div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setOpenDetail(true)}
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Event detail
                    </button>
                    <button 
                      onClick={() => setOpenOrganizerDetail(true)}
                      className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Organizer detail
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Zones Section */}
            <div className="space-y-0">
              {/* Table */}
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
                          <td className="py-3 px-4 text-gray-800">{z.row}</td>
                          <td className="py-3 px-4 text-gray-800">{z.column}</td>
                          <td className="py-3 px-4 text-gray-800">{z.sale}</td>
                          <td className="py-3 px-4 text-gray-800">{z.price}</td>
                        </tr>
                      ))}
                      {tzPageItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 px-4 text-center text-sm text-gray-500">No ticket zones.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Pagination */}
              <div className="bg-white rounded-b-lg shadow-sm">
                <PaginationControls
                  currentPage={tzPage}
                  totalPages={tzTotalPages}
                  onPageChange={setTzPage}
                  showPageNumbers
                />
              </div>
            </div>
          </div>

          {/* Seat stats + filter + search */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex gap-4">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg text-sm font-medium">
                Available Seat: {eventData.seatStats.available}
              </div>
              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg text-sm font-medium">
                Reserved Seat: {eventData.seatStats.reserved}
              </div>
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-lg text-sm font-medium">
                Sold Seat: {eventData.seatStats.sold}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <CategoryRadio
                options={resvFilterOptions}
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
                        <td className="py-3 px-4"><input type="checkbox" className="rounded" /></td>
                        <td className="py-3 px-4 text-gray-800 font-mono text-sm">{r.id}</td>
                        <td className="py-3 px-4 text-gray-800">{r.date}</td>
                        <td className="py-3 px-4 text-gray-800">{r.seatId}</td>
                        <td className="py-3 px-4 text-gray-800">{r.total}</td>
                        <td className="py-3 px-4 text-gray-800">{r.user}</td>
                        <td className="py-3 px-4 text-gray-800">{r.paymentMethod}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === "COMPLETE" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                              }`}
                          >
                            {r.status === "COMPLETE" ? "SOLD" : "RESERVED"}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {resvPageItems.length === 0 && (
                      <tr>
                        <td className="py-6 px-4 text-center text-sm text-gray-500" colSpan={7}>
                          No reservations found.
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
      <DetailModal open={openDetail} onClose={() => setOpenDetail(false)} />
      <OrganizerDetailModal open={openOrganizerDetail} onClose={() => setOpenOrganizerDetail(false)} />
    </div>
  );
}