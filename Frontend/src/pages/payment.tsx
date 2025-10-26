 // src/pages/payment.tsx
    "use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { CheckCircle2, Calendar, MapPin } from "lucide-react";

type ReservedResponse = {
    reservedId: number;
    userId?: number;
    eventId?: number;
    ticketTypeId?: number;
    quantity?: number;
    totalAmount?: number;
    paymentStatus?: "UNPAID" | "PAID" | string;
    registrationDatetime?: string;
    paymentDatetime?: string;
    confirmationCode?: string;
    notes?: string;
    paymentMethod?: "Credit Card" | "Bank Transfer" | "QR Payment" | string | null;
};

const fmt = (iso?: string) =>
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

export default function PaymentPage() {
    const { reservedId } = useParams<{ reservedId: string }>();
    const navigate = useNavigate();

    const [resv, setResv] = useState<ReservedResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<"Credit Card" | "Bank Transfer" | "QR Payment">("Credit Card");

    useEffect(() => {
        if (!reservedId) return;
        (async () => {
            try {
                setLoading(true);
                setError(null);
                // baseURL ของ api คือ /api ดังนั้นอย่าเติม /api ซ้ำ
                const { data } = await api.get<ReservedResponse>(`/public/reservations/${reservedId}`);
                setResv(data);
                // ถ้ามี method เดิม (เคยจ่ายแล้ว) ให้แสดง
                if (data?.paymentMethod && (["Credit Card","Bank Transfer","QR Payment"] as const).includes(data.paymentMethod as any)) {
                    setMethod(data.paymentMethod as any);
                }
            } catch (e: any) {
                setError(e?.response?.data?.error || "Failed to load reservation");
                setResv(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [reservedId]);

    const isPaid = (resv?.paymentStatus ?? "").toUpperCase() === "PAID";
    const amountText = useMemo(() => {
        const n = Number(resv?.totalAmount ?? 0);
        if (Number.isNaN(n)) return "-";
        return "฿" + n.toLocaleString();
    }, [resv?.totalAmount]);

    async function handlePayWith(methodArg: "Credit Card" | "Bank Transfer" | "QR Payment") {
        if (!reservedId || !resv) return;
        try {
            setPaying(true);
            setError(null);
            // ส่ง method ไปให้ backend บันทึก
            const { data } = await api.post<ReservedResponse>(`/public/reservations/${reservedId}/pay`, {
                method: methodArg,
            });
            setResv(data);
        } catch (e: any) {
            setError(e?.response?.data?.error || "Payment failed");
        } finally {
            setPaying(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-black text-white">
                <div className="max-w-4xl mx-auto px-6 py-4 text-xl font-bold">BUTCON — Payment</div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {loading ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm">Loading…</div>
                ) : error ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm text-red-600">{error}</div>
                ) : !resv ? (
                    <div className="bg-white p-6 rounded-lg shadow-sm">Reservation not found.</div>
                ) : (
                    <>
                        {/* Summary */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="text-sm text-gray-500">RESERVATION</div>
                                    <div className="font-mono text-lg">{resv.reservedId}</div>
                                </div>
                                <div
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                                        isPaid ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"
                                    }`}
                                >
                                    {isPaid ? "PAID" : "UNPAID"}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-gray-500">Event ID</div>
                                    <div className="font-semibold">{resv.eventId ?? "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-gray-500">Ticket Type</div>
                                    <div className="font-semibold">{resv.ticketTypeId ?? "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-gray-500">Quantity</div>
                                    <div className="font-semibold">{resv.quantity ?? "-"}</div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <div className="text-gray-500">Total</div>
                                    <div className="font-semibold text-red-600">{amountText}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                                <div className="flex items-center gap-2 text-gray-700">
                                    <Calendar className="w-4 h-4" />
                                    <span>Reserved at: {fmt(resv.registrationDatetime)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-700">
                                    <MapPin className="w-4 h-4" />
                                    <span>Payment at: {fmt(resv.paymentDatetime)}</span>
                                </div>
                            </div>

                            {resv.confirmationCode && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Confirmation Code: <span className="font-mono">{resv.confirmationCode}</span>
                                </div>
                            )}
                        </div>

                        {/* Payment Box */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border">
                            <div className="text-lg font-bold text-gray-800">Choose payment method</div>

                            <div className="mt-3 space-y-2 text-sm">
                                {(["Credit Card", "Bank Transfer", "QR Payment"] as const).map((m) => (
                                    <label key={m} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="pm"
                                            value={m}
                                            checked={method === m}
                                            onChange={() => setMethod(m)}
                                        />
                                        <span>{m}</span>
                                    </label>
                                ))}
                            </div>

                            <p className="text-sm text-gray-600 mt-3">
                                ปุ่มนี้เป็นการ “จำลอง” การชำระเงิน: เมื่อกดระบบจะเปลี่ยนสถานะเป็น <b>PAID</b> และออก
                                <b> Confirmation Code </b> ให้
                            </p>

                            <div className="mt-4 flex gap-3">
                                <button
                                    onClick={() => handlePayWith(method)}
                                    disabled={isPaid || paying}
                                    className="px-6 py-3 rounded-full font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                    {isPaid ? "Already Paid" : paying ? "Processing…" : `Pay ${amountText}`}
                                </button>
                                <button
                                    onClick={() => navigate(-1)}
                                    className="px-6 py-3 rounded-full font-semibold border border-gray-300 text-gray-800 bg-white hover:bg-gray-50"
                                >
                                    Back
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}

