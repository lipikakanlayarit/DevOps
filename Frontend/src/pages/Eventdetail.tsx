// src/pages/EventDetails.tsx
import { useRef, useState } from "react";
import { Plus, Calendar, Clock, X, MapPin, Image, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/AuthContext";

type DateTimeEntry = {
    id: number;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
};

export default function EventDetails() {
    const { state } = useAuth();

    const [eventData, setEventData] = useState({
        eventName: "",
        category: "",
        locationType: "venue",
        locationName: "",
        description: "",
    });

    const [dateTimeEntries, setDateTimeEntries] = useState<DateTimeEntry[]>([
        { id: 1, startDate: "2025-10-21", startTime: "19:00", endDate: "2025-10-21", endTime: "22:00" },
    ]);

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [imgError, setImgError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const addDateTimeEntry = () => {
        setDateTimeEntries((prev) => [
            ...prev,
            {
                id: prev.length ? Math.max(...prev.map((p) => p.id)) + 1 : 1,
                startDate: "",
                startTime: "",
                endDate: "",
                endTime: "",
            },
        ]);
    };

    const removeDateTimeEntry = (id: number) => {
        setDateTimeEntries((prev) => prev.filter((e) => e.id !== id));
    };

    // ✅ FIX 1: แปลงเป็น ISO 8601 format (เพิ่ม Z สำหรับ UTC)
    function toISO8601String(date: string, time: string) {
        if (!date || !time) return "";
        // "2025-10-21" + "19:00" -> "2025-10-21T19:00:00Z"
        return `${date}T${time}:00Z`;
    }

    const handleSaveEvent = async () => {
        // ✅ FIX 2: ถ้าไม่ใช้ JWT ให้ลบเงื่อนไขนี้ออก หรือปรับตามระบบ auth
        // if (state.status !== "authenticated") {
        //     alert("โปรดล็อกอินก่อนสร้างอีเวนต์");
        //     return;
        // }

        if (!eventData.eventName) { alert("กรุณากรอก Event Name"); return; }
        if (!eventData.category) { alert("กรุณาเลือก Category"); return; }
        if (!coverFile) { alert("กรุณาอัปโหลดรูปภาพ"); return; }
        if (dateTimeEntries.length === 0) { alert("กรุณาระบุวันและเวลา"); return; }

        // Validate datetime
        const firstEntry = dateTimeEntries[0];
        if (!firstEntry.startDate || !firstEntry.startTime) {
            alert("กรุณาระบุวันและเวลาเริ่มต้น");
            return;
        }
        if (!firstEntry.endDate || !firstEntry.endTime) {
            alert("กรุณาระบุวันและเวลาสิ้นสุด");
            return;
        }

        setIsSubmitting(true);

        try {
            const categoryMap: Record<string, number> = {
                concert: 1,
                seminar: 2,
                exhibition: 3,
            };

            // ✅ FIX 3: ใช้ ISO 8601 format
            const startDatetime = toISO8601String(firstEntry.startDate, firstEntry.startTime);
            const endDatetime = toISO8601String(firstEntry.endDate, firstEntry.endTime);

            // ✅ FIX 4: ปรับ payload ให้ตรงกับ Backend (EventRequest)
            const payload = {
                organizerId: 1, // ⚠️ ควรใช้จาก state.user.id ถ้ามีระบบ auth
                eventName: eventData.eventName,
                description: eventData.description || "",
                categoryId: categoryMap[eventData.category],
                startDatetime,
                endDatetime,
                venueName: eventData.locationType === "venue" ? eventData.locationName : "TBA",
                locationName: eventData.locationName || "", // ✅ Backend ใช้ venue_address
                coverImageUrl: `https://example.com/uploads/${coverFile.name}`, // ✅ ต้องเป็น URL เต็ม
            };

            console.log("Sending payload:", payload);

            // ✅ FIX 5: เรียก API โดยไม่ต้องใส่ Authorization ถ้า permitAll แล้ว
            const headers: HeadersInit = {
                "Content-Type": "application/json",
                ...(state.status === "authenticated" && state.token ? { Authorization: `Bearer ${state.token}` } : {}),
            };

            const res = await fetch("/api/events", {
                method: "POST",
                headers,
                // organizerId จะปล่อยให้ backend อ่านจาก JWT; หากไม่มี JWT ให้ส่งค่าที่มีอยู่ (กรณีทดสอบ)
                body: JSON.stringify({
                    ...payload,
                    ...(state.status !== "authenticated" ? { organizerId: 1 } : {}),
                }),
            });

            // อ่านข้อความจาก backend เพื่อช่วยดีบัก
            const text = await res.text();

            if (!res.ok) {
                console.error("Response error:", text);
                throw new Error(`HTTP ${res.status}: ${text || "(no message)"}`);
            }

            const result = text ? JSON.parse(text) : {};
            console.log("Event created:", result);
            alert(`สร้างอีเว้นต์สำเร็จ! ID: ${result.event_id}`);

            // ✅ FIX 6: Reset form หลังสร้างสำเร็จ
            setEventData({
                eventName: "",
                category: "",
                locationType: "venue",
                locationName: "",
                description: "",
            });
            setDateTimeEntries([
                { id: 1, startDate: "", startTime: "", endDate: "", endTime: "" },
            ]);
            clearImage();

        } catch (error) {
            console.error("Error creating event:", error);
            alert("เกิดข้อผิดพลาด: " + (error as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            <main className="flex-1 p-6">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
                    </div>

                    <div className="space-y-6">
                        {/* Event details card */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Event Details</h2>
                                <p className="text-sm text-gray-600">Add all of your event details.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Event Name <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Name of your event"
                                        value={eventData.eventName}
                                        onChange={(e) => setEventData({ ...eventData, eventName: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Categories <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <select
                                        value={eventData.category}
                                        onChange={(e) => setEventData({ ...eventData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    >
                                        <option value="">Select</option>
                                        <option value="concert">Concert</option>
                                        <option value="seminar">Seminar</option>
                                        <option value="exhibition">Exhibition</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Upload Picture <span className="text-red-500 ml-1">*</span>
                                    </label>

                                    {coverPreview && (
                                        <div className="relative w-full max-w-2xl">
                                            <img
                                                src={coverPreview}
                                                alt="Preview"
                                                className="w-full aspect-video object-cover rounded-lg border"
                                            />
                                            <button
                                                type="button"
                                                onClick={clearImage}
                                                className="absolute top-2 right-2 bg-white/90 hover:bg-white text-red-600 border rounded-full p-1 shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                                            className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium"
                                        >
                                            <Image className="w-4 h-4" />
                                            {coverPreview ? "Change image" : "Choose image"}
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG, GIF up to 10MB</p>
                                        {imgError && <p className="text-xs text-red-600 mt-1">{imgError}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date & time */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Show Date and Time</h2>
                            </div>

                            <div className="space-y-6">
                                {dateTimeEntries.map((entry, index) => (
                                    <div key={entry.id} className="relative space-y-4 p-4 border border-gray-200 rounded-lg">
                                        {dateTimeEntries.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeDateTimeEntry(entry.id)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Start Date</label>
                                                <div className="relative">
                                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={entry.startDate}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].startDate = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">Start Time</label>
                                                <div className="relative">
                                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="time"
                                                        value={entry.startTime}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].startTime = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">End Date</label>
                                                <div className="relative">
                                                    <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="date"
                                                        value={entry.endDate}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].endDate = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-gray-700">End Time</label>
                                                <div className="relative">
                                                    <Clock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                    <input
                                                        type="time"
                                                        value={entry.endTime}
                                                        onChange={(e) => {
                                                            const updated = [...dateTimeEntries];
                                                            updated[index].endTime = e.target.value;
                                                            setDateTimeEntries(updated);
                                                        }}
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    type="button"
                                    onClick={addDateTimeEntry}
                                    className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50"
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
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="locationType"
                                            value="venue"
                                            checked={eventData.locationType === "venue"}
                                            onChange={(e) => setEventData({ ...eventData, locationType: e.target.value })}
                                            className="hidden"
                                        />
                                        <span
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                                                eventData.locationType === "venue"
                                                    ? "border-blue-600 text-blue-600 bg-blue-50"
                                                    : "border-gray-300"
                                            }`}
                                        >
                                            <MapPin className="w-4 h-4" />
                                            Venue
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="locationType"
                                            value="announced"
                                            checked={eventData.locationType === "announced"}
                                            onChange={(e) => setEventData({ ...eventData, locationType: e.target.value })}
                                            className="hidden"
                                        />
                                        <span
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                                                eventData.locationType === "announced"
                                                    ? "border-blue-600 text-blue-600 bg-blue-50"
                                                    : "border-gray-300"
                                            }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            To be announced
                                        </span>
                                    </label>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Location name <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Search for location"
                                        value={eventData.locationName}
                                        onChange={(e) => setEventData({ ...eventData, locationName: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                            </div>

                            <textarea
                                placeholder="Add more details about your event"
                                value={eventData.description}
                                onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                                rows={6}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className="rounded-full bg-red-500 px-5 py-3 text-white font-medium hover:bg-red-600"
                                onClick={() => {
                                    if (confirm("ยกเลิกการสร้างอีเวนต์?")) {
                                        window.history.back();
                                    }
                                }}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSaveEvent}
                                disabled={isSubmitting}
                                className="rounded-full bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Saving..." : "Save & Continue"}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}