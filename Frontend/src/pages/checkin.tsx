// src/pages/checkin.tsx
"use client";

import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { CheckCircle2, Ticket, User2, MapPin, AlertTriangle, Tag } from "lucide-react";

type ReservedResponse = {
    reservedId: number;
    userId?: number | null;
    eventId?: number | null;
    ticketTypeId?: number | null;
    quantity?: number | null;
    totalAmount?: number | null;
    paymentStatus?: "UNPAID" | "PAID" | string | null;
    registrationDatetime?: string | null;
    paymentDatetime?: string | null;
    confirmationCode?: string | null;
    notes?: string | null;
    paymentMethod?: string | null;
    userFullName?: string | null;

    // seat-level
    seatId?: number | null;
    seatLabel?: string | null; // e.g. "VIP A1"
    zoneName?: string | null;
    unitPrice?: number | null; // zone price
};

export default function CheckinConfirmPage() {
    const { reservedId } = useParams<{ reservedId: string }>();
    const [sp] = useSearchParams();
    const navigate = useNavigate();

    const eventIdFromQuery = sp.get("eventId") || "";
    const seatIdFromQuery = sp.get("seatId") || "";

    const [data, setData] = useState<ReservedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);

    const isPaid = (data?.paymentStatus ?? "").toUpperCase() === "PAID";

    useEffect(() => {
        if (!reservedId) return;
        (async () => {
            try {
                setLoading(true);
                setErr(null);

                const path =
                    `/public/reservations/${reservedId}` +
                    (seatIdFromQuery ? `?seatId=${encodeURIComponent(seatIdFromQuery)}` : "");

                const { data } = await api.get<ReservedResponse>(path);
                setData(data);
            } catch (e: any) {
                setErr(e?.response?.data?.error || "Failed to load reservation");
                setData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [reservedId, seatIdFromQuery]);

    async function handleConfirm() {
        if (!data) return;
        try {
            setConfirming(true);

            // TODO: ถ้ามี API เช็คอินจริง ให้เรียกที่นี่
            // await api.post("/organizer/checkin", { reservedId: data.reservedId, seatId: data.seatId ?? Number(seatIdFromQuery) });

            // ✅ fallback eventId/seatId จาก query หาก API ไม่ส่งกลับมา
            const targetEventId = data.eventId ?? (eventIdFromQuery ? Number(eventIdFromQuery) : undefined);
            const targetSeatId =
                data.seatId != null ? data.seatId : seatIdFromQuery ? Number(seatIdFromQuery) : undefined;

            if (!targetEventId) {
                alert("ไม่พบ Event ID สำหรับนำทางไป Dashboard");
                return;
            }

            // ส่ง reservedId + seatId กลับ dashboard (seat-level key)
            const qp = new URLSearchParams();
            qp.set("checked", String(data.reservedId));
            if (targetSeatId != null && !Number.isNaN(targetSeatId)) qp.set("seatId", String(targetSeatId));

            // หมายเหตุ: จะนับว่าเช็คอินแล้วก็ต่อเมื่อ Dashboard รับ query นี้แล้วบันทึกลง localStorage
            navigate(`/eventdashboard/${targetEventId}?${qp.toString()}`, { replace: true });
        } finally {
            setConfirming(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-slate-200/60">
                <div className="px-6 py-5 border-b">
                    <h1 className="text-lg font-bold text-slate-800">ยืนยันการเข้างาน (Organizer)</h1>
                    <p className="text-sm text-slate-500">ตรวจสอบข้อมูลและกด “ยืนยันการเข้างาน”</p>
                </div>

                {loading ? (
                    <div className="p-6">Loading…</div>
                ) : err ? (
                    <div className="p-6 text-rose-600">{err}</div>
                ) : !data ? (
                    <div className="p-6">Reservation not found.</div>
                ) : (
                    <div className="p-6 space-y-4">
                        {!isPaid && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 p-3 flex gap-2">
                                <AlertTriangle className="w-4 h-4 mt-0.5" />
                                <div className="text-sm">
                                    รายการนี้ยัง<strong>ไม่ได้ชำระเงิน</strong> จึงไม่สามารถเช็คอินได้
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                                <Ticket className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-500">Reserved ID</span>
                                <span className="font-mono font-semibold">{data.reservedId}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-500">Event ID</span>
                                <span className="font-semibold">
                  {(data.eventId ?? eventIdFromQuery) || "-"}
                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <User2 className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-500">User</span>
                                <span className="font-semibold">{data.userFullName || data.userId || "-"}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Seat</span>
                                <span className="font-semibold">{data.seatLabel ?? data.zoneName ?? "-"}</span>
                            </div>

                            {typeof data.unitPrice === "number" && (
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-slate-500" />
                                    <span className="text-slate-500">Price</span>
                                    <span className="font-semibold">{data.unitPrice.toLocaleString("en-US")}</span>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <span className="text-slate-500">Status</span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                    }`}
                                >
                  {(data.paymentStatus ?? "").toUpperCase() || "-"}
                </span>
                            </div>

                            {data.confirmationCode && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    <span className="text-slate-500">Confirmation Code</span>
                                    <span className="font-mono">{data.confirmationCode}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-2 flex gap-3">
                            <button
                                onClick={handleConfirm}
                                disabled={!isPaid || confirming}
                                className="px-5 py-3 rounded-xl bg-black text-white font-semibold hover:bg-zinc-800 disabled:opacity-50"
                            >
                                {confirming ? "Processing…" : "ยืนยันการเข้างาน"}
                            </button>
                            <button
                                onClick={() => window.close()}
                                className="px-5 py-3 rounded-xl border bg-white hover:bg-slate-50"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>

                        <p className="text-xs text-slate-400">
                            {/** ถ้ามี API สำหรับบันทึก Check-in จริง ให้เชื่อมต่อในปุ่มด้านบน (ส่ง reservedId + seatId)*/}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
