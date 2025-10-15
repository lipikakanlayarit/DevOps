// src/pages/Eventdetail.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebarorg";
import { Input } from "@/components/inputtxt";
import { Plus, X, Image as ImageIcon, Trash2, MapPin, Clock } from "lucide-react";

type DateTimeEntry = {
    id: number;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

function toUTC(dateStr: string, timeStr: string) {
    return new Date(`${dateStr}T${timeStr}:00+07:00`).toISOString();
}
function isoToLocalParts(iso?: string) {
    if (!iso) return { date: "", time: "" };
    try {
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, "0");
        return {
            date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
            time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
        };
    } catch { return { date: "", time: "" }; }
}

export default function EventDetails() {
    const { eventId } = useParams<{ eventId?: string }>();
    const isEdit = !!eventId && Number(eventId) > 0;
    const navigate = useNavigate();

    const [eventData, setEventData] = useState({
        eventName: "",
        category: "",
        locationType: "venue" as "venue" | "announced",
        locationName: "",
        description: "",
    });

    const [dateTimeEntries, setDateTimeEntries] = useState<DateTimeEntry[]>([
        { id: 1, startDate: "", startTime: "", endDate: "", endTime: "" },
    ]);

    // ---------- Image ----------
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [imgError, setImgError] = useState<string | null>(null);

    const pickFile = () => fileInputRef.current?.click();
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgError(null);

        if (!/^image\//.test(file.type)) {
            setImgError("กรุณาเลือกรูปภาพเท่านั้น (PNG/JPG/JPEG/GIF)");
            e.target.value = "";
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setImgError("ไฟล์ใหญ่เกิน 10MB");
            e.target.value = "";
            return;
        }

        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };
    const clearImageLocalOnly = () => {
        setCoverFile(null);
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const deleteImageFromServer = async () => {
        if (!isEdit || !eventId) return;
        if (!confirm("ลบรูปจากเซิร์ฟเวอร์ใช่ไหม?")) return;
        try {
            await api.delete(`/events/${eventId}/cover`);
            clearImageLocalOnly();
            // เคลียร์ preview ให้ไม่โชว์รูปเดิม
            setCoverPreview(null);
        } catch (e: any) {
            alert(e?.response?.data?.error || "ลบรูปไม่สำเร็จ");
        }
    };

    // ---------- Misc ----------
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);

    // ---------- Prefill when edit ----------
    useEffect(() => {
        if (!isEdit) {
            const now = new Date();
            const next = new Date(now.getTime() + 7 * 24 * 3600 * 1000);
            const pad = (n: number) => String(n).padStart(2, "0");
            const yyyy = next.getFullYear();
            const mm = pad(next.getMonth() + 1);
            const dd = pad(next.getDate());
            setDateTimeEntries([{
                id: 1,
                startDate: `${yyyy}-${mm}-${dd}`,
                startTime: "19:00",
                endDate: `${yyyy}-${mm}-${dd}`,
                endTime: "22:00",
            }]);
            return;
        }

        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/events/${eventId}`);
                if (ignore || !data) return;

                const name = data.eventName ?? data.event_name ?? data.name ?? "";
                const desc = data.description ?? "";
                const catId = data.categoryId ?? data.category_id ?? "";
                const venueName = data.venueName ?? data.venue_name ?? "";
                const startIso = data.startDateTime ?? data.startDatetime ?? data.start_datetime;
                const endIso = data.endDateTime ?? data.endDatetime ?? data.end_datetime;

                const s = isoToLocalParts(startIso);
                const e = isoToLocalParts(endIso);

                setEventData({
                    eventName: name,
                    description: desc,
                    category: catId ? String(catId) : "",
                    locationType: venueName && venueName !== "To be announced" ? "venue" : "announced",
                    locationName: venueName && venueName !== "To be announced" ? venueName : "",
                });
                setDateTimeEntries([{ id: 1, startDate: s.date, startTime: s.time, endDate: e.date, endTime: e.time }]);

                // ✅ preload รูปจาก backend (cache-busting)
                setCoverPreview(`/api/events/${eventId}/cover?ts=${Date.now()}`);

                // cache ไป Ticketdetail
                const cached = {
                    id: Number(eventId),
                    eventName: name,
                    startDateTime: startIso,
                    endDateTime: endIso,
                    venueName,
                };
                localStorage.setItem(`event:${eventId}`, JSON.stringify(cached));
                localStorage.setItem(`event:last`, JSON.stringify({ id: Number(eventId), name }));
            } catch (e) {
                console.error("LOAD_EVENT_FAILED", e);
            } finally {
                setLoading(false);
            }
        })();
        return () => { ignore = true; };
    }, [isEdit, eventId]);

    // ---------- Save ----------
    async function handleSave() {
        const first = dateTimeEntries[0];

        if (!eventData.eventName.trim()) return alert("กรุณากรอก Event Name");
        if (!eventData.category) return alert("กรุณาเลือก Category");
        if (!first || !first.startDate || !first.startTime || !first.endDate || !first.endTime) {
            return alert("กรุณากรอกวันและเวลาให้ครบ");
        }
        if (eventData.locationType === "venue" && !eventData.locationName.trim()) {
            return alert("กรุณากรอกชื่อสถานที่ (Location name)");
        }

        const payload = {
            eventName: eventData.eventName.trim(),
            description: eventData.description || "",
            startDateTime: toUTC(first.startDate, first.startTime),
            endDateTime: toUTC(first.endDate, first.endTime),
            venueName: eventData.locationType === "venue" ? eventData.locationName.trim() : "To be announced",
            venueAddress: "",
            maxCapacity: null as number | null,
            categoryId: Number(eventData.category),
        };

        setSaving(true);
        try {
            let newId = Number(eventId);
            if (isEdit) {
                await api.put(`/events/${eventId}`, payload);
            } else {
                const { data: res } = await api.post(`/events`, payload, { headers: { "Content-Type": "application/json" } });
                newId = res?.event_id ?? res?.id;
                if (!newId) throw new Error("ไม่พบ event_id หรือ id ในผลลัพธ์ของ backend");
            }

            // ✅ ถ้ามีไฟล์รูป → อัปโหลดไปเซิร์ฟเวอร์
            if (coverFile) {
                const fd = new FormData();
                fd.append("file", coverFile);
                await api.post(`/events/${newId}/cover`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }

            const cached = { id: newId, ...payload, savedAt: new Date().toISOString() };
            localStorage.setItem(`event:${newId}`, JSON.stringify(cached));
            localStorage.setItem(`event:last`, JSON.stringify({ id: newId, name: payload.eventName }));

            alert(isEdit ? "อัปเดตอีเวนต์สำเร็จ!" : "สร้างอีเวนต์สำเร็จ!");
            navigate(`/ticketdetail/${newId}`, { replace: true });
        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data?.error || err?.response?.data?.message || "บันทึกไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    }

    // ---------- UI ----------
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEdit ? "Edit Event" : "Event Details"}
                        </h1>
                        {isEdit && (
                            <Link to={`/ticketdetail/${eventId}`} className="text-sm underline text-blue-600 hover:text-blue-800">
                                ไป Ticket Details ของอีเวนต์นี้
                            </Link>
                        )}
                    </div>

                    {loading ? (
                        <div className="bg-white p-6 rounded-lg shadow-sm">กำลังโหลดข้อมูลอีเวนต์...</div>
                    ) : (
                        <>
                            {/* Event Details */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Details</h2>
                                    <p className="text-sm text-gray-600">Add all of your event details.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Event Name */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Event Name <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Input
                                            placeholder="Name of your project"
                                            value={eventData.eventName}
                                            onChange={(e) => setEventData({ ...eventData, eventName: e.target.value })}
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Category <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={eventData.category}
                                                onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none pr-10"
                                                required
                                            >
                                                <option value="">Select</option>
                                                <option value="1">Concert</option>
                                                <option value="2">Seminar</option>
                                                <option value="3">Festival</option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500">* ต้องเลือกให้ตรงกับ categories ในฐานข้อมูล</p>
                                    </div>

                                    {/* Upload Picture */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Upload Picture <span className="text-red-500 ml-1">*</span>
                                        </label>

                                        {coverPreview && (
                                            <div className="relative w-full max-w-2xl">
                                                <img src={coverPreview} alt="Preview" className="w-full aspect-[16/9] object-cover rounded-lg border" />
                                                <button
                                                    type="button"
                                                    onClick={clearImageLocalOnly}
                                                    className="absolute top-2 right-10 bg-white/90 hover:bg-white text-red-600 border rounded-full p-1 shadow-sm"
                                                    title="Remove image (local)"
                                                    aria-label="Remove image (local)"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}

                                        <div className={`border-2 border-dashed ${coverPreview ? "border-gray-200" : "border-gray-300"} rounded-lg p-6 text-center hover:border-gray-400 transition-colors`}>
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            <button
                                                type="button"
                                                onClick={pickFile}
                                                className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                            >
                                                <ImageIcon className="w-4 h-4" />
                                                {coverPreview ? "Change image" : "Choose image"}
                                            </button>

                                            {isEdit && (
                                                <button
                                                    type="button"
                                                    onClick={deleteImageFromServer}
                                                    className="inline-flex items-center gap-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 ml-3 px-4 py-2 rounded-lg text-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                    ลบรูปจากเซิร์ฟเวอร์
                                                </button>
                                            )}

                                            <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG, GIF up to 10MB</p>
                                            {imgError && <p className="text-xs text-red-600 mt-1">{imgError}</p>}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Show Date and Time */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Show Date and Time</h2>
                                    <p className="text-sm text-gray-600">Let attendee know your event's start and end time.</p>
                                </div>

                                <div className="space-y-6">
                                    {dateTimeEntries.map((entry, index) => (
                                        <div key={entry.id} className="relative space-y-4 p-4 border border-gray-200 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => setDateTimeEntries(prev => prev.filter(e => e.id !== entry.id))}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                                aria-label="Remove date-time block"
                                                title="Remove"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={entry.startDate}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].startDate = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">Start Time</label>
                                                    <input
                                                        type="time"
                                                        step={300}
                                                        value={entry.startTime}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].startTime = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={entry.endDate}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].endDate = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-gray-700">End Time</label>
                                                    <input
                                                        type="time"
                                                        step={300}
                                                        value={entry.endTime}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].endTime = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() =>
                                            setDateTimeEntries(prev => [
                                                ...prev,
                                                { id: prev.length ? Math.max(...prev.map(p => p.id)) + 1 : 1, startDate: "", startTime: "", endDate: "", endTime: "" },
                                            ])
                                        }
                                        className="flex items-center gap-2 text-[#09090B] border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Date and Time
                                    </button>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
                                    <p className="text-sm text-gray-600">Let attendees know where your event is held.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="locationType"
                                                value="venue"
                                                checked={eventData.locationType === "venue"}
                                                onChange={(e) => setEventData({ ...eventData, locationType: e.target.value as any })}
                                                className="hidden"
                                            />
                                            <span className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                                                eventData.locationType === "venue" ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}>
                        <MapPin className="w-4 h-4" /> Venue
                      </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="locationType"
                                                value="announced"
                                                checked={eventData.locationType === "announced"}
                                                onChange={(e) => setEventData({ ...eventData, locationType: e.target.value as any })}
                                                className="hidden"
                                            />
                                            <span className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                                                eventData.locationType === "announced" ? "border-blue-600 text-blue-600 bg-blue-50" : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                            }`}>
                        <Clock className="w-4 h-4" /> To be announced
                      </span>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Location name <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <Input
                                            placeholder={eventData.locationType === "venue" ? "Main Hall / Auditorium A" : "To be announced (auto)"}
                                            value={eventData.locationType === "venue" ? eventData.locationName : "To be announced"}
                                            onChange={(e) => setEventData({ ...eventData, locationName: e.target.value })}
                                            disabled={eventData.locationType !== "venue"}
                                        />
                                        {eventData.locationType !== "venue" && (
                                            <p className="text-xs text-gray-500">ระบบจะบันทึกเป็น “To be announced” อัตโนมัติ</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-white rounded-lg p-6 shadow-sm">
                                <div className="mb-6">
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                                </div>
                                <textarea
                                    placeholder="Add more details about your event."
                                    value={eventData.description}
                                    onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                    rows={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3">
                                <Link to="/organizationmnge" className="rounded-full bg-[#FA3A2B] px-5 py-3 text-white font-medium shadow-sm hover:bg-[#e23325] transition-colors">
                                    Cancel
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="rounded-full border border-gray-300 px-6 py-3 text-gray-900 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : isEdit ? "Update & Continue" : "Save & Continue"}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
