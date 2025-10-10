// src/pages/Ticketdetail.tsx
"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebarorg"
import { Input } from "@/components/inputtxt"
import { Plus, Calendar, Clock as ClockIcon, X } from "lucide-react"
import { Link } from "react-router-dom"
import { api } from "@/lib/api"

type ZoneItem = {
    id: number
    seatRow: string
    seatColumn: string
    zone: string
    price: string
}

export default function TicketDetail() {
    // อ่าน event ล่าสุดจาก localStorage (จากขั้นสร้าง event)
    const [lastEvent, setLastEvent] = useState<{ id: number; name?: string } | null>(null)
    const [cachedEvent, setCachedEvent] = useState<any>(null)

    useEffect(() => {
        try {
            const lastRaw = localStorage.getItem("event:last")
            if (lastRaw) {
                const last = JSON.parse(lastRaw)
                setLastEvent(last)
                const evRaw = localStorage.getItem(`event:${last.id}`)
                if (evRaw) setCachedEvent(JSON.parse(evRaw))
            }
        } catch {
            // ignore parse error
        }
    }, [])

    // Ticket Details (Zones)
    const [zones, setZones] = useState<ZoneItem[]>([
        { id: 1, seatRow: "", seatColumn: "", zone: "", price: "" },
    ])

    const addZone = () => {
        setZones(prev => [
            ...prev,
            {
                id: prev.length ? Math.max(...prev.map(z => z.id)) + 1 : 1,
                seatRow: "",
                seatColumn: "",
                zone: "",
                price: "",
            },
        ])
    }

    const removeZone = (id: number) => {
        setZones(prev => prev.filter(z => z.id !== id))
    }

    const setZoneField = (index: number, field: keyof ZoneItem, value: string) => {
        setZones(prev => {
            const next = [...prev]
            next[index] = { ...next[index], [field]: value }
            return next
        })
    }

    // Sales Period
    const [sales, setSales] = useState({
        startDate: "2025-10-21",
        startTime: "19:00",
        endDate: "2025-10-21",
        endTime: "22:00",
    })

    // Ticket Allowed per Order
    const [limits, setLimits] = useState({ min: "1", max: "1" })

    // Ticket Status
    const [status, setStatus] = useState<"available" | "unavailable" | "">("")
    const [saving, setSaving] = useState(false)

    const onToggleStatus = (value: "available" | "unavailable") => {
        setStatus(prev => (prev === value ? "" : value))
    }

    // Save → ยิง API ไป backend
    async function handleSaveTicketDetail() {
        try {
            if (!lastEvent?.id) {
                alert("ไม่พบ event ล่าสุด — กรุณากลับไปสร้างอีเวนต์ใหม่อีกครั้ง");
                return;
            }
            if (!zones.length) {
                alert("กรุณาเพิ่มอย่างน้อย 1 โซน");
                return;
            }
            if (!sales.startDate || !sales.startTime || !sales.endDate || !sales.endTime) {
                alert("กรุณากรอกช่วงเวลา Sales ให้ครบ");
                return;
            }

            setSaving(true);

            const eventId = lastEvent.id;

            const payload = {
                eventId,
                ticket: {
                    name: "General Admission",
                    price: null, // ถ้าราคาผูกตามโซน ปล่อย null ที่ ticket
                    salesStart: `${sales.startDate}T${sales.startTime}:00`,
                    salesEnd:   `${sales.endDate}T${sales.endTime}:00`,
                    perOrderMin: Number(limits.min || 1),
                    perOrderMax: Number(limits.max || 1),
                    status, // "available" | "unavailable" | ""
                },
                zones: zones.map(z => ({
                    name: z.zone,
                    seatRow: z.seatRow,
                    seatColumn: z.seatColumn,
                    price: z.price ? Number(z.price) : null, // ถ้าราคาตามโซนจะไปลง zone_ticket_types ที่ backend
                })),
            };

            console.log("DEBUG save ticket", {
                url: `/events/${eventId}/tickets/setup`,
                tokenBeginsWith: (localStorage.getItem("auth.token") || "").slice(0, 12),
                payload,
            });

            // แนะนำแบบรวบยอด (ทำ controller ไว้ที่ POST /api/events/{eventId}/tickets/setup)
            await api<{ success: boolean; ticketTypeId?: number }>(
                `/events/${eventId}/tickets/setup`,
                { method: "POST", body: JSON.stringify(payload) }
            );

            alert("บันทึก Ticket Detail เรียบร้อย");
            // TODO: จะ navigate ไปหน้าอื่นต่อก็ได้ เช่น dashboard
            // navigate("/eventdashboard");
        } catch (e: any) {
            console.error(e);
            alert(e?.message ?? "บันทึก Ticket Detail ไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />

            <main className="flex-1 p-6">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Ticket Detail</h1>
                    </div>

                    {/* Event summary (จาก localStorage) */}
                    {lastEvent && (
                        <div className="mb-2 p-4 rounded border bg-white">
                            <div className="text-sm text-gray-500">Event just created (local)</div>
                            <div className="font-semibold">
                                ID: {lastEvent.id}{lastEvent.name ? ` — ${lastEvent.name}` : ""}
                            </div>
                            {cachedEvent && (
                                <div className="text-sm text-gray-600">
                                    <div>Start: {cachedEvent.startDateTime ?? cachedEvent.startDatetime}</div>
                                    <div>End:   {cachedEvent.endDateTime   ?? cachedEvent.endDatetime}</div>
                                    <div>Venue: {cachedEvent.venueName}</div>
                                    <div>Location: {cachedEvent.locationName}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ───────────────── Ticket Details ───────────────── */}
                    <section className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ticket Details</h2>

                        <div className="space-y-4">
                            {zones.map((z, idx) => (
                                <div key={z.id} className="relative p-4 border border-gray-200 rounded-lg">
                                    {/* ปุ่มลบ zone */}
                                    <button
                                        type="button"
                                        onClick={() => removeZone(z.id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                        aria-label="Remove zone"
                                        title="Remove"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Seat Row</label>
                                            <Input
                                                placeholder="Value"
                                                value={z.seatRow}
                                                onChange={(e) => setZoneField(idx, "seatRow", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Seat Column</label>
                                            <Input
                                                placeholder="Value"
                                                value={z.seatColumn}
                                                onChange={(e) => setZoneField(idx, "seatColumn", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Zone</label>
                                            <Input
                                                placeholder="Value"
                                                value={z.zone}
                                                onChange={(e) => setZoneField(idx, "zone", e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Price</label>
                                            <Input
                                                placeholder="Value"
                                                value={z.price}
                                                onChange={(e) => setZoneField(idx, "price", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addZone}
                                className="inline-flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-gray-900 hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Zone
                            </button>
                        </div>
                    </section>

                    {/* ───────────────── Sales Period ───────────────── */}
                    <section className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Sales Period</h2>
                        <p className="text-sm text-gray-600 mb-4">
                            Tell event Attendees when your event sales start and end
                        </p>

                        {/* Start Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Start Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Start Date</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={sales.startDate}
                                        onChange={(e) => setSales((s) => ({ ...s, startDate: e.target.value }))}
                                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {sales.startDate && (
                                        <button
                                            type="button"
                                            onClick={() => setSales((s) => ({ ...s, startDate: "" }))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            aria-label="Clear start date"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Start Time */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Start Time</label>
                                <div className="relative">
                                    <ClockIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="time"
                                        value={sales.startTime}
                                        onChange={(e) => setSales((s) => ({ ...s, startTime: e.target.value }))}
                                        step={300}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* dummy cols ให้ layout เหมือนภาพ */}
                            <div className="opacity-0 pointer-events-none md:block hidden">
                                <label className="text-sm font-medium text-gray-700">spacer</label>
                                <Input disabled placeholder="" />
                            </div>
                            <div className="opacity-0 pointer-events-none md:block hidden">
                                <label className="text-sm font-medium text-gray-700">spacer</label>
                                <Input disabled placeholder="" />
                            </div>
                        </div>

                        {/* End Row */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* End Date */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">End Date</label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="date"
                                        value={sales.endDate}
                                        onChange={(e) => setSales((s) => ({ ...s, endDate: e.target.value }))}
                                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    {sales.endDate && (
                                        <button
                                            type="button"
                                            onClick={() => setSales((s) => ({ ...s, endDate: "" }))}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            aria-label="Clear end date"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* End Time */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">End Time</label>
                                <div className="relative">
                                    <ClockIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="time"
                                        value={sales.endTime}
                                        onChange={(e) => setSales((s) => ({ ...s, endTime: e.target.value }))}
                                        step={300}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="opacity-0 pointer-events-none md:block hidden">
                                <label className="text-sm font-medium text-gray-700">spacer</label>
                                <Input disabled placeholder="" />
                            </div>
                            <div className="opacity-0 pointer-events-none md:block hidden">
                                <label className="text-sm font-medium text-gray-700">spacer</label>
                                <Input disabled placeholder="" />
                            </div>
                        </div>
                    </section>

                    {/* ───────────────── Advanced Setting ───────────────── */}
                    <section className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900">Advanced Setting</h2>
                        <p className="text-sm text-gray-600">Additional configurations for your ticket</p>
                        <div className="my-4 border-t border-gray-200" />

                        {/* Ticket allowed per order */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <h3 className="text-base font-semibold text-gray-900">Ticket allowed per order</h3>
                                <p className="text-sm text-gray-600">
                                    you can limit the number of tickets users can purchase per day
                                </p>
                            </div>
                            <div />
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Minimum ticket <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Input
                                    placeholder="1"
                                    value={limits.min}
                                    onChange={(e) => setLimits(l => ({ ...l, min: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Maximum ticket <span className="text-red-500 ml-1">*</span>
                                </label>
                                <Input
                                    placeholder="1"
                                    value={limits.max}
                                    onChange={(e) => setLimits(l => ({ ...l, max: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Ticket Status */}
                        <div className="mt-8 space-y-3">
                            <h3 className="text-base font-semibold text-gray-900">Ticket Status</h3>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={status === "available"}
                                    onChange={() => onToggleStatus("available")}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-800">Available</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={status === "unavailable"}
                                    onChange={() => onToggleStatus("unavailable")}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-800">Unavailable</span>
                            </label>
                        </div>
                    </section>

                    {/* ───────────────── Action Buttons ───────────────── */}
                    <div className="flex justify-end gap-3">
                        <Link
                            to="/organization"
                            className="rounded-full bg-[#FA3A2B] px-5 py-3 text-white font-medium shadow-sm hover:bg-[#e23325] transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="button"
                            className="rounded-full border border-gray-300 px-6 py-3 text-gray-900 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            onClick={handleSaveTicketDetail}
                            disabled={saving}
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    )
}
