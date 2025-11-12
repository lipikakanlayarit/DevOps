// src/pages/eventdashboard.tsx
"use client";

import type React from "react";
import { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Sidebar } from "@/components/sidebarorg";
import { Input } from "@/components/inputtxt";
import { Search, CircleDollarSign, Ticket, Users } from "lucide-react";

/* =========================
   Types for real dashboard
   ========================= */
type ReservationRow = {
    id: number | string;           // reserved_id (หรือ reserved_seat_id ก็ได้ถ้าหลังบ้านเปลี่ยน)
    reserved_code: string | null;
    status: string;                // PAID/UNPAID (raw from backend)
    total: number;                 // fallback ถ้าไม่ส่ง unit_price
    payment_method?: string | null;
    user: string;                  // ชื่อ/ยูส จากหลังบ้าน
    date?: string;                 // 'DD Mon YYYY'
    seat_label: string;            // ex. "supervip A1"
    registration_ts?: string;      // ISO datetime
    expire_at?: string;            // ISO datetime

    // seat-level
    seat_id?: number | string;     // 👈 ระบุที่นั่ง
    unit_price?: number;           // 👈 ราคา/ที่นั่ง (โซน)
};

type DashboardResponse = {
    eventId: number;
    eventName: string;
    ticketTarget: number;
    sold: number;
    reserved: number;
    available: number;
    netPayout: number;
    ticketSoldNow: number;
    rows: ReservationRow[];
};

/* =========================
   Small utilities
   ========================= */
function readToken(): string | null {
    const keys = ["authToken", "accessToken", "token", "jwt", "Authorization"];
    for (const k of keys) {
        const v =
            (typeof localStorage !== "undefined" && localStorage.getItem(k)) ||
            (typeof sessionStorage !== "undefined" && sessionStorage.getItem(k));
        if (v) return v;
    }
    return null;
}

function getAuthHeaders(): Record<string, string> {
    const token = readToken();
    const headers: Record<string, string> = {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
    };
    if (token) {
        headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    return headers;
}

function buildApiUrl(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const base = (import.meta as any)?.env?.VITE_API_BASE as string | undefined;
    if (base) return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
    return path;
}

/* === Local attendance store (per event, seat-level) === */
const checkedKey = (eventId: string | number) => `evt:${eventId}:checked:v2`;

// คีย์ต่อแถว (seat-level ถ้ามี seat_id)
function rowKey(r: ReservationRow): string {
    const rid = String(r.id ?? "");
    const sid = r.seat_id != null ? String(r.seat_id) : "";
    return sid ? `${rid}:${sid}` : rid;
}

// คีย์จาก reservedId + seatId ใน query
function makeKey(reservedId?: string | number | null, seatId?: string | number | null): string {
    const rid = reservedId != null ? String(reservedId) : "";
    const sid = seatId != null ? String(seatId) : "";
    return sid ? `${rid}:${sid}` : rid;
}

function loadCheckedSet(eventId: string | number): Set<string> {
    try {
        const raw = localStorage.getItem(checkedKey(eventId));
        if (!raw) return new Set();
        const arr = JSON.parse(raw) as string[];
        return new Set(arr.map(String));
    } catch {
        return new Set();
    }
}
function addChecked(eventId: string | number, key: string) {
    const k = checkedKey(eventId);
    const set = loadCheckedSet(eventId);
    set.add(key);
    localStorage.setItem(k, JSON.stringify(Array.from(set)));
}
function removeChecked(eventId: string | number, key: string) {
    const k = checkedKey(eventId);
    const set = loadCheckedSet(eventId);
    set.delete(key);
    localStorage.setItem(k, JSON.stringify(Array.from(set)));
}

/* Expanded normalize for UI badge */
type UiStatus = "COMPLETE" | "UNPAID" | "EXPIRED";
function normalizePaid(raw: string): "COMPLETE" | "UNPAID" {
    const s = String(raw || "").trim().toUpperCase();
    return s === "PAID" ? "COMPLETE" : "UNPAID";
}
function isExpiredRow(r: ReservationRow, now = new Date()): boolean {
    if (!r.expire_at) return false;
    const ex = new Date(r.expire_at);
    return ex.getTime() <= now.getTime();
}
function uiStatusOf(r: ReservationRow, now = new Date()): UiStatus {
    const paidOrUnpaid = normalizePaid(r.status);
    if (paidOrUnpaid === "COMPLETE") return "COMPLETE";
    return isExpiredRow(r, now) ? "EXPIRED" : "UNPAID";
}
function fmtAmount(n: number): string {
    if (!isFinite(n)) return "0.00";
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function Skeleton({ w = 120, h = 16, rounded = false }: { w?: number; h?: number; rounded?: boolean }) {
    return (
        <span
            className={`inline-block animate-pulse bg-slate-200 ${rounded ? "rounded-full" : "rounded-md"}`}
            style={{ width: w, height: h }}
        />
    );
}

/* =========================
   Component
   ========================= */
export default function EventDashboard() {
    const { eventId: eventIdParam } = useParams<{ eventId?: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const eventId = eventIdParam ?? searchParams.get("eventId") ?? "";

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [eventName, setEventName] = useState<string>("");
    const [available, setAvailable] = useState<number>(0);
    const [reserved, setReserved] = useState<number>(0);
    const [sold, setSold] = useState<number>(0);

    const [netPayout, setNetPayout] = useState<number>(0);
    const [ticketSoldNow, setTicketSoldNow] = useState<number>(0);
    const [ticketTarget, setTicketTarget] = useState<number>(0);

    const [rows, setRows] = useState<ReservationRow[]>([]);
    const [query, setQuery] = useState("");

    // attendance + highlight
    const [checkedSet, setCheckedSet] = useState<Set<string>>(() => loadCheckedSet(eventId || "0"));
    const [highlightKey, setHighlightKey] = useState<string | null>(null);

    const GRID_COLS = "grid-cols-[0.9fr_0.8fr_0.9fr_0.5fr_1.2fr]";

    useEffect(() => {
        if (!eventId) {
            navigate("/organizationmnge", { replace: true });
            return;
        }
    }, [eventId, navigate]);

    useEffect(() => {
        if (!eventId) return;

        let aborted = false;
        (async () => {
            try {
                setLoading(true);
                setError(null);

                const url = buildApiUrl(`/api/organizer/events/${eventId}/dashboard`);
                const res = await fetch(url, {
                    method: "GET",
                    credentials: "include",
                    headers: getAuthHeaders(),
                });

                if (res.status === 401) {
                    const current = encodeURIComponent(window.location.pathname + window.location.search);
                    setError("Unauthorized (401) — ต้องลงชื่อเข้าใช้");
                    navigate(`/login?redirect=${current}`, { replace: true });
                    return;
                }

                if (!res.ok) {
                    const text = await res.text();
                    setError(`HTTP ${res.status} ${res.statusText} - ${text || "No body"}`);
                    setLoading(false);
                    return;
                }

                const data: DashboardResponse = await res.json();
                if (aborted) return;

                setEventName(String(data.eventName ?? ""));
                setAvailable(Number(data.available ?? 0));
                setReserved(Number(data.reserved ?? 0));
                setSold(Number(data.sold ?? 0));
                setNetPayout(Number(data.netPayout ?? 0));
                setTicketSoldNow(Number(data.ticketSoldNow ?? 0));
                setTicketTarget(Number(data.ticketTarget ?? 0));
                setRows(Array.isArray(data.rows) ? data.rows : []);
            } catch (e: any) {
                if (!aborted) setError(e?.message || "Failed to load dashboard");
            } finally {
                if (!aborted) setLoading(false);
            }
        })();

        return () => {
            aborted = true;
        };
    }, [eventId, navigate]);

    // consume ?checked=<reservedId>&seatId=<seatId> -> save seat-level checked + highlight
    useEffect(() => {
        const cid = searchParams.get("checked");
        const sid = searchParams.get("seatId");
        if (!cid || !eventId) return;

        const k = makeKey(cid, sid);
        addChecked(eventId, k);
        setCheckedSet(loadCheckedSet(eventId));
        setHighlightKey(k);

        const sp = new URLSearchParams(searchParams);
        sp.delete("checked");
        sp.delete("seatId");
        setTimeout(() => setSearchParams(sp, { replace: true }), 600);

        setTimeout(() => setHighlightKey(null), 8000);
    }, [searchParams, setSearchParams, eventId]);

    // filter/search
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((r) => {
            const idText = String(r.id ?? "").toLowerCase();
            const code = String(r.reserved_code ?? "").toLowerCase();
            const seat = String(r.seat_label ?? "").toLowerCase();
            const user = String(r.user ?? "").toLowerCase();
            const status = String(r.status ?? "").toLowerCase();
            return (
                idText.includes(q) ||
                code.includes(q) ||
                seat.includes(q) ||
                user.includes(q) ||
                status.includes(q)
            );
        });
    }, [rows, query]);

    // donut: active = paid + unpaid(not expired)
    const { paidCount, pendingCount, paidPct, pendingPct } = useMemo(() => {
        const now = new Date();

        const paid = rows.filter((r) => normalizePaid(r.status) === "COMPLETE").length;
        const pendingActive = rows.filter(
            (r) => normalizePaid(r.status) === "UNPAID" && !isExpiredRow(r, now)
        ).length;

        const activeTotal = paid + pendingActive;
        const p1 = activeTotal ? Math.round((paid / activeTotal) * 100) : 0;
        const p2 = activeTotal ? Math.round((pendingActive / activeTotal) * 100) : 0;

        return { paidCount: paid, pendingCount: pendingActive, paidPct: p1, pendingPct: p2 };
    }, [rows]);

    // attendance derived (seat-level)
    const { attendees, noShows, checkedInCount } = useMemo(() => {
        const paidRows = rows.filter((r) => normalizePaid(r.status) === "COMPLETE");
        const att = paidRows.filter((r) => checkedSet.has(rowKey(r)));
        const noS = paidRows.filter((r) => !checkedSet.has(rowKey(r)));
        return {
            attendees: att,
            noShows: noS,
            checkedInCount: att.length,
        };
    }, [rows, checkedSet]);

    // Undo handler (seat-level key)
    function handleUndoCheckinKey(key: string) {
        if (!eventId) return;
        removeChecked(eventId, key);
        setCheckedSet(loadCheckedSet(eventId));
    }

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <Sidebar />

            <main className="flex-1 p-4 md:p-8">
                <div className="mx-auto w-full max-w-[1400px]">
                    <div className="mb-4 text-slate-700">
                        <div className="text-xl font-semibold">
                            Event Dashboard{eventName ? ` — ${eventName}` : ""}
                        </div>
                        <div className="text-sm">Event ID: <span className="font-mono">{eventId}</span></div>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                            โหลดข้อมูลไม่สำเร็จ: {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4 md:gap-6">
                        <div className="space-y-4">
                            <StatCard
                                title="Net Payout (THB)"
                                icon={<CircleDollarSign className="w-6 h-6 text-emerald-600" />}
                            >
                                <div className="mt-2 text-2xl md:text-3xl font-bold text-slate-800">
                                    {fmtAmount(netPayout)}
                                </div>
                            </StatCard>

                            <StatCard title="Total Ticket Sold" icon={<Ticket className="w-6 h-6 text-blue-600" />}>
                                <div className="mt-2 text-2xl md:text-3xl font-bold text-slate-800">
                                    {ticketSoldNow}{" "}
                                    <span className="text-lg md:text-xl font-semibold text-slate-500">/ {ticketTarget}</span>
                                </div>
                            </StatCard>

                            <StatCard title="Total Summary" customClass="w-full xl:max-w-[360px]">
                                <div className="mt-2 flex flex-col items-center gap-4">
                                    <Donut value={paidPct} size={90} />
                                    <div className="w-full flex flex-col gap-2 text-sm">
                                        <Legend colorClass="bg-emerald-500" label="Paid" value={`${paidCount} (${paidPct}%)`} />
                                        <Legend colorClass="bg-amber-400" label="Pending" value={`${pendingCount} (${pendingPct}%)`} />
                                    </div>
                                </div>
                            </StatCard>
                        </div>

                        <section className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden">
                            {/* Controls */}
                            <div className="flex flex-wrap items-center gap-3 px-4 md:px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
                                <Badge label={`Available Seat : ${available}`} variant="available" wide />
                                <Badge label={`Reserved Seat : ${reserved}`} variant="reserved" wide />
                                <Badge label={`Sold Seat : ${sold}`} variant="sold" wide />

                                <div className="ml-auto w-full sm:w-auto sm:max-w-md relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder="Search reservations..."
                                        className="pl-10 h-11 sm:h-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20 w-full"
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                {/* Head */}
                                <div
                                    className={`min-w-[900px] grid ${GRID_COLS} px-4 md:px-6 py-3 text-[11px] md:text-xs font-bold tracking-wide uppercase text-slate-500 bg-slate-50 border-b border-slate-200`}
                                >
                                    <div className="text-left">Reserve ID</div>
                                    <div className="text-left">Seat(s)</div>
                                    <div className="text-left">Total</div>
                                    <div className="text-left">User</div>
                                    <div className="text-center">Status</div>
                                </div>

                                {/* Rows */}
                                <div className="min-w-[900px] divide-y divide-slate-100">
                                    {(loading ? Array.from({ length: 6 }) : filtered).map((r: any, idx) => {
                                        const st = loading ? null : uiStatusOf(r);

                                        const isHL =
                                            !loading &&
                                            highlightKey &&
                                            rowKey(r) === highlightKey;

                                        return (
                                            <div
                                                key={loading ? `skeleton-${idx}` : `${rowKey(r)}-${idx}`}
                                                className={`grid ${GRID_COLS} px-4 md:px-6 py-3 md:py-4 text-sm items-center hover:bg-slate-50 transition-colors
                          ${isHL ? "bg-emerald-50/40 ring-2 ring-emerald-300/70" : ""}`}
                                            >
                                                {/* Reserve ID */}
                                                <div className="truncate text-slate-700 font-mono text-medium text-left">
                                                    {loading ? <Skeleton w={160} /> : r.reserved_code || r.id}
                                                </div>

                                                {/* Seat label */}
                                                <div className="text-slate-800 font-medium text-left">
                                                    {loading ? <Skeleton w={220} /> : r.seat_label || "-"}
                                                </div>

                                                {/* Total -> ใช้ unit_price ถ้ามี (ราคา/ที่นั่ง) */}
                                                <div className="text-slate-700 font-medium text-left tabular-nums">
                                                    {loading ? (
                                                        <Skeleton w={90} />
                                                    ) : (
                                                        fmtAmount(Number((r.unit_price ?? r.total) ?? 0))
                                                    )}
                                                </div>

                                                {/* User */}
                                                <div className="text-slate-600 font-medium text-left">
                                                    {loading ? <Skeleton w={100} /> : r.user || "-"}
                                                </div>

                                                {/* Status */}
                                                <div className="text-center">
                                                    {loading ? (
                                                        <Skeleton w={80} h={22} rounded />
                                                    ) : (
                                                        <StatusBadge status={st as UiStatus} />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ===== Attendance Card (ใต้ตาราง) ===== */}
                    <section className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
                        <div className="px-5 py-4 border-b flex items-center gap-2">
                            <Users className="w-5 h-5 text-slate-700" />
                            <h3 className="text-base font-semibold text-slate-800">Attendance (Check-in)</h3>
                            <div className="ml-auto text-sm text-slate-600">
                                Checked-in: <b>{checkedInCount}</b> / Paid: <b>{paidCount}</b>
                                {"  "}
                                <span className="text-slate-400">•</span>{" "}
                                No-show: <b>{Math.max(0, paidCount - checkedInCount)}</b>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-0">
                            {/* Attended */}
                            <div className="p-5 border-r md:border-r-slate-200">
                                <div className="text-sm font-semibold text-emerald-700 mb-3">เข้าร่วมแล้ว</div>
                                {attendees.length === 0 ? (
                                    <div className="text-sm text-slate-500">ยังไม่มีผู้เข้าร่วมเช็คอิน</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {attendees.map((r) => (
                                            <li key={rowKey(r)} className="text-sm flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium text-slate-800">{r.user || "-"}</div>
                                                    <div className="text-xs text-slate-500">
                                                        <span className="font-mono">{r.reserved_code || r.id}</span> • Seat {r.seat_label || "-"}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                            IN
                          </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleUndoCheckinKey(rowKey(r))}
                                                        className="text-xs px-2 py-1 rounded-md border bg-white hover:bg-slate-50"
                                                        title="ยกเลิกการเช็คอิน"
                                                    >
                                                        Undo
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* No-show (Paid but not checked-in) */}
                            <div className="p-5">
                                <div className="text-sm font-semibold text-amber-700 mb-3">ยังไม่เช็คอิน</div>
                                {noShows.length === 0 ? (
                                    <div className="text-sm text-slate-500">ทุกคนที่ชำระเงินแล้วได้เช็คอินครบ</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {noShows.map((r) => (
                                            <li key={rowKey(r)} className="text-sm flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="truncate font-medium text-slate-800">{r.user || "-"}</div>
                                                    <div className="text-xs text-slate-500">
                                                        <span className="font-mono">{r.reserved_code || r.id}</span> • Seat {r.seat_label || "-"}
                                                    </div>
                                                </div>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          WAIT
                        </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}

/* =========================
   UI helpers
   ========================= */
function StatCard({
                      title,
                      children,
                      icon,
                      customClass,
                  }: {
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    customClass?: string;
}) {
    return (
        <section className={`bg-white rounded-2xl p-5 shadow-md border border-slate-200/50 ${customClass ?? ""}`}>
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-800">{title}</h3>
                {icon && (
                    <span className="inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-slate-100">
            {icon}
          </span>
                )}
            </div>
            <div className="mt-2">{children}</div>
        </section>
    );
}

function Badge({
                   label,
                   variant = "default",
                   wide = false,
               }: {
    label: string;
    variant?: "available" | "reserved" | "sold" | "default";
    wide?: boolean;
}) {
    const variants = {
        available: "bg-emerald-50 text-emerald-700 border-emerald-200",
        reserved: "bg-blue-50 text-blue-700 border-blue-200",
        sold: "bg-rose-50 text-rose-700 border-rose-200",
        default: "bg-slate-50 text-slate-700 border-slate-200",
    };

    return (
        <span className={`inline-flex items-center rounded-full border ${wide ? "px-6" : "px-3 md:px-4"} py-1.5 md:py-2 text-xs md:text-sm font-medium ${variants[variant]}`}>
      {label}
    </span>
    );
}

function StatusBadge({ status }: { status: "COMPLETE" | "UNPAID" | "EXPIRED" }) {
    if (status === "COMPLETE") {
        return (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        COMPLETE
      </span>
        );
    }
    if (status === "EXPIRED") {
        return (
            <span className="inline-flex items-center rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
        EXPIRED
      </span>
        );
    }
    return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
      UNPAID
    </span>
    );
}

function Legend({ colorClass, label, value }: { colorClass: string; label: string; value: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${colorClass}`} />
            <span className="text-slate-700 font-medium text-xs md:text-sm">{label}</span>
            <span className="text-slate-500 font-mono text-xs md:text-sm">{value}</span>
        </div>
    );
}

function Donut({ value, size = 100 }: { value: number; size?: number }) {
    const v = Math.max(0, Math.min(100, value));
    const angle = (v / 100) * 360;
    const bg = `conic-gradient(rgb(5 150 105 / 0.45) 0deg ${angle}deg, rgb(209 250 229 / 0.8) ${angle}deg 360deg)`;
    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <div className="rounded-full" style={{ width: size, height: size, background: bg }} />
            <div className="absolute bg-white rounded-full" style={{ width: size * 0.64, height: size * 0.64 }} />
            <div className="absolute text-xl font-bold text-slate-800">{v}%</div>
        </div>
    );
}
