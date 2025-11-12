// src/pages/Profile.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { api, profileApi } from "@/lib/api";
import TicketCard from "@/components/TicketCard";
import EventCard from "@/components/EventCard";
import EventToolbar from "@/components/EventToolbar";
import QRCode from "qrcode";

/* =========================
   Types
   ========================= */
interface UserProfile {
    id: string;
    username: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    idCard?: string;
    // Organizer fields
    companyName?: string;
    taxId?: string;
    address?: string;
    verificationStatus?: string;
}

type UITicket = {
    key: string;
    poster: string;
    reserveId: string;
    eventId?: string | number;
    seatId?: string | number;      // seat-level QR
    title: string;
    venue: string;
    showDate: string;
    zone: string;
    row?: string | number;
    column?: string | number;
    unitPrice?: number;            // price per seat / zone
    total?: number | string;       // fallback
    type?: string;
    effectiveStatus?: "ONSALE" | "OFFSALE" | "UPCOMING";
};

/* =========================
   Helpers
   ========================= */
const money = (v: any) => {
    const n =
        typeof v === "number"
            ? v
            : Number(String(v ?? "").toString().replace(/[, ]/g, "") || 0);
    return n.toLocaleString("en-US");
};
const safeStr = (s: any) => (s == null ? "" : String(s));

/* =========================
   ProfileCard
   ========================= */
function ProfileCard({
                         profile,
                         onOpenEdit,
                     }: {
    profile: UserProfile | null;
    onOpenEdit: () => void;
}) {
    if (!profile) {
        return (
            <div className="w-72 h-[450px] bg-white border rounded-lg shadow p-4 flex items-center justify-center">
                <p className="text-gray-500">Loading...</p>
            </div>
        );
    }

    const isOrganizer = profile.role === "ORGANIZER";

    return (
        <div className="w-72 h-[450px] bg-white border rounded-lg shadow p-4 flex flex-col items-center relative">
            <button
                onClick={onOpenEdit}
                className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full cursor-pointer hover:bg-red-600"
                title="Edit Profile"
            />
            <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-4xl font-bold text-gray-400">
                {profile.firstName.charAt(0)}
                {profile.lastName.charAt(0)}
            </div>

            <p className="text-gray-500 mb-6">{profile.email}</p>

            <div className="w-full space-y-3">
                <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="font-medium">
                        {profile.firstName} {profile.lastName}
                    </p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Username</p>
                    <p className="font-medium">{profile.username}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-sm">Phone Number</p>
                    <p className="font-medium">{profile.phoneNumber}</p>
                </div>
                {isOrganizer ? (
                    <>
                        <div>
                            <p className="text-gray-400 text-sm">Company</p>
                            <p className="font-medium">{profile.companyName || "-"}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className="font-medium">{profile.verificationStatus || "-"}</p>
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-gray-400 text-sm">ID Card</p>
                        <p className="font-medium">{profile.idCard || "-"}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================
   EditProfilePopup
   ========================= */
function EditProfilePopup({
                              profile,
                              onClose,
                              onSave,
                          }: {
    profile: UserProfile;
    onClose: () => void;
    onSave: () => void;
}) {
    const isOrganizer = profile.role === "ORGANIZER";
    const [formData, setFormData] = useState({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phoneNumber: profile.phoneNumber,
        idCard: profile.idCard || "",
        companyName: profile.companyName || "",
        taxId: profile.taxId || "",
        address: profile.address || "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (f: string, v: string) => {
        setFormData((p) => ({ ...p, [f]: v }));
        setError("");
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            if (isOrganizer) {
                await profileApi.updateOrganizer({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    companyName: formData.companyName,
                    taxId: formData.taxId,
                    address: formData.address,
                });
            } else {
                await profileApi.updateUser({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    idCard: formData.idCard,
                });
            }
            alert("Profile updated successfully!");
            onSave();
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.error || e?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-lg w-[700px] p-8">
                <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>
                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">First Name</label>
                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.firstName}
                            onChange={(e) => handleChange("firstName", e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Last Name</label>
                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.lastName}
                            onChange={(e) => handleChange("lastName", e.target.value)}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-sm text-gray-600 mb-1">Phone Number</label>
                        <input
                            className="w-full border rounded-lg px-3 py-2"
                            value={formData.phoneNumber}
                            onChange={(e) => handleChange("phoneNumber", e.target.value)}
                        />
                    </div>

                    {isOrganizer ? (
                        <>
                            <div className="col-span-2">
                                <label className="block text-sm text-gray-600 mb-1">Company Name</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.companyName}
                                    onChange={(e) => handleChange("companyName", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Tax ID</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.taxId}
                                    onChange={(e) => handleChange("taxId", e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Address</label>
                                <input
                                    className="w-full border rounded-lg px-3 py-2"
                                    value={formData.address}
                                    onChange={(e) => handleChange("address", e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-600 mb-1">ID Card</label>
                            <input
                                className="w-full border rounded-lg px-3 py-2"
                                value={formData.idCard}
                                onChange={(e) => handleChange("idCard", e.target.value)}
                            />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="bg-gray-300 text-black font-semibold px-6 py-2 rounded-full hover:bg-gray-400 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-red-500 text-white font-semibold px-6 py-2 rounded-full hover:bg-red-600 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Ticket Popup (QR ต่อที่นั่ง)
   ========================= */
function TicketPopup({
                         ticket,
                         onClose,
                     }: {
    ticket: UITicket | null;
    onClose: () => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    if (!ticket) return null;

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // ทำลิงก์ให้ไม่ซ้ำด้วย seatId (ถ้ามี) หรือใช้ zone/row/col เป็นตัวบอก
    const queryParts: string[] = [];
    if (ticket.eventId != null) queryParts.push(`eventId=${ticket.eventId}`);
    if (ticket.seatId != null) {
        queryParts.push(`seatId=${ticket.seatId}`);
    } else {
        if (ticket.zone) queryParts.push(`zone=${encodeURIComponent(ticket.zone)}`);
        if (ticket.row != null) queryParts.push(`row=${encodeURIComponent(String(ticket.row))}`);
        if (ticket.column != null) queryParts.push(`col=${encodeURIComponent(String(ticket.column))}`);
    }
    const q = queryParts.length ? `?${queryParts.join("&")}` : "";
    const checkinUrl = `${origin}/checkin/${ticket.reserveId}${q}`;

    useEffect(() => {
        if (!canvasRef.current) return;
        void QRCode.toCanvas(canvasRef.current, checkinUrl, { width: 220, margin: 1 });
    }, [checkinUrl]);

    const copyLink = () => {
        navigator.clipboard?.writeText(checkinUrl);
        alert("คัดลอกลิงก์ Check-in แล้ว");
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="w-[820px] max-w-full bg-white overflow-hidden text-black shadow-lg relative rounded-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-600 text-3xl z-10 font-bold leading-none w-8 h-8 flex items-center justify-center"
                >
                    ×
                </button>

                {/* โชว์ราคาเป็นรายโซน/ที่นั่ง */}
                <TicketCard
                    poster={ticket.poster}
                    reserveId={safeStr(ticket.reserveId)}
                    title={ticket.title}
                    venue={ticket.venue}
                    showDate={safeStr(ticket.showDate)}
                    zone={safeStr(ticket.zone)}
                    row={ticket.row as any}
                    column={ticket.column as any}
                    total={money(ticket.unitPrice ?? ticket.total ?? 0)} // ใช้ unitPrice ก่อน
                />

                {/* Organizer Check-in */}
                <div className="px-8 pb-8 pt-6 bg-white">
                    <div className="text-lg font-bold flex items-center gap-2 mb-3">
                        <span className="inline-block w-4 h-4 rounded-sm border border-black" />
                        Organizer Check-in
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <canvas ref={canvasRef} className="border rounded-lg p-2" />
                        <div className="text-sm break-all">
                            <div className="text-gray-500">Check-in URL</div>
                            <div className="font-mono text-xs md:text-sm">{checkinUrl}</div>

                            <div className="mt-3 flex gap-3">
                                <button
                                    type="button"
                                    onClick={copyLink}
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white hover:bg-gray-50"
                                >
                                    Copy link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* =========================
   Main
   ========================= */
export default function Profile() {
    const { state } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [tickets, setTickets] = useState<UITicket[]>([]);
    const [cat, setCat] = useState("all");
    const [query, setQuery] = useState("");
    const [order, setOrder] = useState<"newest" | "oldest">("newest");

    const [showEdit, setShowEdit] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<UITicket | null>(null);

    // profile
    const fetchProfile = async () => {
        try {
            const res = await profileApi.getProfile(); // /api/auth/me
            setProfile(res.data);
        } finally {
            setLoading(false);
        }
    };

    // tickets (จริงจาก backend)
    const fetchTickets = async () => {
        const res = await api.get("/profile/my-tickets");
        const rows = Array.isArray(res.data) ? res.data : [];

        // 1 แถว = 1 ที่นั่ง
        const mapped: UITicket[] = rows.map((m: any, i: number) => {
            const rowLabel = m.rowLabel ?? m.row ?? "";
            const seatNo = m.seatNumber ?? m.col ?? "";
            const reserveId = safeStr(m.reserveId || "");
            const seatId = m.seatId ?? m.reservedSeatId ?? null;
            const uniqueKey = `${reserveId}-${seatId ?? `${rowLabel}-${seatNo}`}-${i}`;

            const unitPrice =
                m.unitPrice ?? m.zonePrice ?? m.pricePerSeat ?? m.price ?? undefined;

            return {
                key: uniqueKey,
                poster: safeStr(m.posterUrl || m.poster || ""),
                reserveId,
                seatId: seatId ?? undefined,
                eventId: m.eventId,
                title: safeStr(m.title || m.eventName || ""),
                venue: safeStr(m.venue || ""),
                showDate: safeStr(m.showDate || m.showDatetime || ""),
                zone: safeStr(m.zone || m.zoneName || ""),
                row: rowLabel,
                column: seatNo,
                unitPrice: typeof unitPrice === "number" ? unitPrice : undefined,
                total: typeof m.total === "number" ? m.total : undefined,
                type: safeStr(m.type || ""),
                effectiveStatus: (m.effectiveStatus || "OFFSALE").toUpperCase(),
            };
        });

        setTickets(mapped);
    };

    useEffect(() => {
        if (state.status === "authenticated") {
            (async () => {
                await Promise.all([fetchProfile(), fetchTickets()]);
            })();
        } else if (state.status === "unauthenticated") {
            window.location.href = "/login";
        }
    }, [state.status]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return tickets
            .filter((t) => (cat === "all" || (t.type || "").toLowerCase() === cat))
            .filter(
                (t) =>
                    !q ||
                    t.title.toLowerCase().includes(q) ||
                    t.venue.toLowerCase().includes(q)
            )
            .sort((a, b) =>
                order === "newest"
                    ? new Date(b.showDate).getTime() - new Date(a.showDate).getTime()
                    : new Date(a.showDate).getTime() - new Date(b.showDate).getTime()
            );
    }, [tickets, cat, query, order]);

    if (loading || state.status === "loading") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-xl">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex p-6 gap-10 bg-gray-100 min-h-screen">
            <div className="ml-6 mr-5">
                <ProfileCard profile={profile} onOpenEdit={() => setShowEdit(true)} />
            </div>

            <div className="flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-6 w-full">
                    <h1 className="text-5xl font-extrabold">My Ticket</h1>
                    <div className="w-fit">
                        <EventToolbar
                            categories={[
                                { label: "All", value: "all" },
                                { label: "Concert", value: "concert" },
                                { label: "Seminar", value: "seminar" },
                                { label: "Exhibition", value: "exhibition" },
                            ]}
                            category={cat}
                            onCategoryChange={setCat}
                            order={order}
                            onOrderChange={setOrder}
                            search={query}
                            onSearchChange={setQuery}
                        />
                    </div>
                </div>

                {/* การ์ดห่างขึ้น + ซ่อนปุ่มเฉพาะหน้านี้ */}
                <div className="myticket-scope grid [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] gap-8">
                    {filtered.map((t) => (
                        <div key={t.key} onClick={() => setSelectedTicket(t)} role="button">
                            <EventCard
                                cover={t.poster}
                                dateRange={t.showDate}
                                title={t.title}
                                venue={t.venue}
                                effectiveStatus={t.effectiveStatus ?? "OFFSALE"}
                                onClickGetTicket={() => setSelectedTicket(t)}
                                className="myticket-card"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ซ่อนปุ่ม action ของการ์ดเฉพาะหน้านี้ */}
            <style>
                {`
          .myticket-scope .myticket-card .pt-1 { display: none !important; }
        `}
            </style>

            {showEdit && profile && (
                <EditProfilePopup
                    profile={profile}
                    onClose={() => setShowEdit(false)}
                    onSave={fetchProfile}
                />
            )}

            {selectedTicket && (
                <TicketPopup ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
            )}
        </div>
    );
}
