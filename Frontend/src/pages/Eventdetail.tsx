// src/pages/Eventdetail.tsx
"use client";

import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/sidebarorg";
import { Input } from "@/components/inputtxt";
import {
    Plus,
    X,
    Image as ImageIcon,
    Trash2,
    MapPin,
    Clock,
} from "lucide-react";

type DateTimeEntry = {
    id: number;
    startDate: string; // YYYY-MM-DD
    startTime: string; // HH:MM
    endDate: string;   // YYYY-MM-DD
    endTime: string;   // HH:MM
};

// แปลงเป็น ISO-8601 พร้อม offset ไทย (+07:00) เพื่อให้ Instant.parse() อ่านได้
function withThaiOffset(dateStr: string, timeStr: string) {
    return `${dateStr}T${timeStr}:00+07:00`;
}

export default function EventDetails() {
    const navigate = useNavigate();

    const [eventData, setEventData] = useState({
        eventName: "",
        category: "", // เก็บค่า id เป็นสตริง "1" | "2" | "3"
        locationType: "venue" as "venue" | "announced",
        locationName: "",
        description: "",
    });

    const [dateTimeEntries, setDateTimeEntries] = useState<DateTimeEntry[]>([
        { id: 1, startDate: "2025-10-21", startTime: "19:00", endDate: "2025-10-21", endTime: "22:00" },
    ]);

    // Image (preview only)
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [imgError, setImgError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const pickFile = () => fileInputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImgError(null);

        const isImage = /^image\//.test(file.type);
        if (!isImage) {
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

    const clearImage = () => {
        setCoverFile(null);
        if (coverPreview) URL.revokeObjectURL(coverPreview);
        setCoverPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Date/time blocks
    const addDateTimeEntry = () => {
        setDateTimeEntries((prev) => [
            ...prev,
            { id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1, startDate: "", startTime: "", endDate: "", endTime: "" },
        ]);
    };

    const removeDateTimeEntry = (id: number) => {
        setDateTimeEntries((prev) => prev.filter((e) => e.id !== id));
    };

    // Save handler + validation
    async function handleSave() {
        if (!eventData.eventName.trim()) return alert("กรุณากรอก Event Name");
        if (!eventData.category) return alert("กรุณาเลือก Category");

        const first = dateTimeEntries[0];
        if (!first || !first.startDate || !first.startTime || !first.endDate || !first.endTime) {
            return alert("กรุณากรอกวันและเวลาให้ครบ");
        }

        if (eventData.locationType === "venue" && !eventData.locationName.trim()) {
            return alert("กรุณากรอกชื่อสถานที่ (Location name)");
        }

        setSaving(true);
        try {
            const payload = {
                eventName: eventData.eventName.trim(),
                description: eventData.description || "",
                startDateTime: withThaiOffset(first.startDate, first.startTime),
                endDateTime:   withThaiOffset(first.endDate, first.endTime),
                venueName: eventData.locationType === "venue" ? eventData.locationName.trim() : "To be announced",
                venueAddress: "",
                maxCapacity: null,
                categoryId: Number(eventData.category), // ส่ง id เป็นตัวเลข (1/2/3)
            };

            const { data: res } = await api.post<{
                id?: number;
                event_id?: number;
                eventName?: string;
                status?: string;
                categoryId?: number;
            }>("/events", payload, {
                headers: { "Content-Type": "application/json" },
            });

            const eventId = res?.event_id ?? res?.id;
            if (!eventId) throw new Error("ไม่พบ event_id หรือ id ในผลลัพธ์ของ backend");

            const cached = { id: eventId, ...payload, savedAt: new Date().toISOString() };
            localStorage.setItem(`event:${eventId}`, JSON.stringify(cached));
            localStorage.setItem(`event:last`, JSON.stringify({ id: eventId, name: eventData.eventName }));

            alert("สร้างอีเวนต์สำเร็จ!");
            navigate("/ticketdetail", { replace: true });
        } catch (err: any) {
            console.error(err);
            alert(err?.response?.data?.error || err?.response?.data?.message || "บันทึกไม่สำเร็จ");
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
                        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
                    </div>

                    {/* Event Details Section */}
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

                            {/* Category (required dropdown, values are IDs) */}
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

                            {/* Upload Picture (preview only) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Upload Picture <span className="text-red-500 ml-1">*</span>
                                </label>

                                {coverPreview && (
                                    <div className="relative w-full max-w-2xl">
                                        <img
                                            src={coverPreview}
                                            alt="Preview"
                                            className="w-full aspect-[16/9] object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 border rounded-full p-1 shadow-sm"
                                            title="Remove image"
                                            aria-label="Remove image"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <div className={`border-2 border-dashed ${coverPreview ? "border-gray-200" : "border-gray-300"} rounded-lg p-6 text-center hover:border-gray-400 transition-colors`}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={pickFile}
                                        className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        <ImageIcon className="w-4 h-4" />
                                        {coverPreview ? "Change image" : "Choose image"}
                                    </button>
                                    <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG, GIF up to 10MB</p>
                                    {imgError && <p className="text-xs text-red-600 mt-1">{imgError}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Show Date and Time Section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Show Date and Time</h2>
                            <p className="text-sm text-gray-600">
                                Let attendee know your event's start and end time for a smooth experience
                            </p>
                        </div>

                        <div className="space-y-6">
                            {dateTimeEntries.map((entry, index) => (
                                <div key={entry.id} className="relative space-y-4 p-4 border border-gray-200 rounded-lg">
                                    {/* Remove entry button */}
                                    <button
                                        type="button"
                                        onClick={() => removeDateTimeEntry(entry.id)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                        aria-label="Remove date-time block"
                                        title="Remove"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    {/* Start Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* Start Date */}
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

                                        {/* Start Time */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">Start Time</label>
                                            <input
                                                type="time"
                                                value={entry.startTime}
                                                onChange={(e) => {
                                                    const updated = [...dateTimeEntries];
                                                    updated[index].startTime = e.target.value;
                                                    setDateTimeEntries(updated);
                                                }}
                                                step={300}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* spacers เพื่อจัด layout */}
                                        <div className="opacity-0 pointer-events-none md:block hidden">
                                            <Input disabled placeholder="" />
                                        </div>
                                        <div className="opacity-0 pointer-events-none md:block hidden">
                                            <Input disabled placeholder="" />
                                        </div>
                                    </div>

                                    {/* End Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* End Date */}
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

                                        {/* End Time */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-gray-700">End Time</label>
                                            <input
                                                type="time"
                                                value={entry.endTime}
                                                onChange={(e) => {
                                                    const updated = [...dateTimeEntries];
                                                    updated[index].endTime = e.target.value;
                                                    setDateTimeEntries(updated);
                                                }}
                                                step={300}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>

                                        {/* spacers */}
                                        <div className="opacity-0 pointer-events-none md:block hidden">
                                            <Input disabled placeholder="" />
                                        </div>
                                        <div className="opacity-0 pointer-events-none md:block hidden">
                                            <Input disabled placeholder="" />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={addDateTimeEntry}
                                className="flex items-center gap-2 text-[#09090B] border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Date and Time
                            </button>
                        </div>
                    </div>

                    {/* Location Section — UI เดิม (toggle) */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Location</h2>
                            <p className="text-sm text-gray-600">
                                Inform attendees where your event is being held and help attendees easily to find activities.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Toggle buttons */}
                            <div className="flex gap-4">
                                {/* Venue */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="locationType"
                                        value="venue"
                                        checked={eventData.locationType === "venue"}
                                        onChange={(e) => setEventData({ ...eventData, locationType: e.target.value as "venue" | "announced" })}
                                        className="hidden"
                                    />
                                    <span
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                                            eventData.locationType === "venue"
                                                ? "border-blue-600 text-blue-600 bg-blue-50"
                                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                    <MapPin className="w-4 h-4" />
                    Venue
                  </span>
                                </label>

                                {/* To be announced */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="locationType"
                                        value="announced"
                                        checked={eventData.locationType === "announced"}
                                        onChange={(e) => setEventData({ ...eventData, locationType: e.target.value as "venue" | "announced" })}
                                        className="hidden"
                                    />
                                    <span
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                                            eventData.locationType === "announced"
                                                ? "border-blue-600 text-blue-600 bg-blue-50"
                                                : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                        }`}
                                    >
                    <Clock className="w-4 h-4" />
                    To be announced
                  </span>
                                </label>
                            </div>

                            {/* Location name */}
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

                    {/* Description Section */}
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                            <p className="text-sm text-gray-600">
                                Adding a short description helps attendees understand what your event is about.
                            </p>
                        </div>

                        <textarea
                            placeholder="Add more details about your event and include what people can expect if they attend."
                            value={eventData.description}
                            onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Link
                            to="/organization"
                            className="rounded-full bg-[#FA3A2B] px-5 py-3 text-white font-medium shadow-sm hover:bg-[#e23325] transition-colors"
                        >
                            Cancel
                        </Link>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-full border border-gray-300 px-6 py-3 text-gray-900 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            {saving ? "Saving..." : "Save & Continue"}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
