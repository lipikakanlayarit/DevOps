import React, { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { profileApi } from "@/lib/api";
import TicketCard from "@/components/TicketCard";
import EventCard from "@/components/EventCard";
import EventToolbar from "@/components/EventToolbar";

// ---------------- Types ----------------
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

// ---------------- ProfileCard ----------------
function ProfileCard({
                         profile,
                         onOpenEdit
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
            ></button>

            <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-4xl font-bold text-gray-400">
                {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </div>

            <p className="text-gray-500 mb-6">{profile.email}</p>

            <div className="w-full space-y-3">
                <div>
                    <p className="text-gray-400 text-sm">Name</p>
                    <p className="font-medium">{profile.firstName} {profile.lastName}</p>
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
                            <p className="font-medium">{profile.companyName || '-'}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Status</p>
                            <p className="font-medium">{profile.verificationStatus || '-'}</p>
                        </div>
                    </>
                ) : (
                    <div>
                        <p className="text-gray-400 text-sm">ID Card</p>
                        <p className="font-medium">{profile.idCard || '-'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------- Edit Popup ----------------
function EditProfilePopup({
                              profile,
                              onClose,
                              onSave
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
        // Organizer fields
        companyName: profile.companyName || "",
        taxId: profile.taxId || "",
        address: profile.address || "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError("");
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");

        try {
            if (isOrganizer) {
                // Update organizer profile
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
                // Update user profile
                await profileApi.updateUser({
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    idCard: formData.idCard,
                });
            }

            console.log("✅ Profile updated successfully");
            alert("Profile updated successfully!");

            onSave();
            onClose();
        } catch (err: any) {
            console.error("❌ Submit error:", err);
            const errorMessage = err.response?.data?.error || err.message || "Failed to update profile";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-lg w-[700px] p-8">
                <h2 className="text-2xl font-bold mb-6">Edit Profile</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <div className="flex gap-8">
                    <div className="flex flex-col items-center">
                        <div className="w-32 h-32 rounded-full bg-gray-300 mb-4 flex items-center justify-center text-4xl font-bold text-gray-500">
                            {formData.firstName.charAt(0)}{formData.lastName.charAt(0)}
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-4">
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
                            <label className="block text-sm text-gray-600 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-lg px-3 py-2"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
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

// ---------------- Ticket Popup ----------------
function TicketPopup({ ticket, onClose }: { ticket: any; onClose: () => void }) {
    if (!ticket) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="w-[780px] max-w-full bg-white overflow-hidden text-black shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-black hover:text-gray-600 text-3xl z-10 font-bold leading-none w-8 h-8 flex items-center justify-center"
                >
                    ×
                </button>
                <div className="w-full h-auto">
                    <TicketCard {...ticket} />
                </div>
            </div>
        </div>
    );
}

// ---------------- Main Component ----------------
export default function Profile() {
    const { state } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [category, setCategory] = useState("all");
    const [query, setQuery] = useState("");
    const [order, setOrder] = useState<"newest" | "oldest">("newest");
    const [showEdit, setShowEdit] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

    // Fetch profile data
    const fetchProfile = async () => {
        try {
            console.log("🔄 Fetching profile...");

            // ใช้ profileApi.getProfile() ซึ่งเรียก /api/auth/me
            const response = await profileApi.getProfile();
            const data = response.data;

            console.log("✅ Profile loaded:", data);
            setProfile(data);
        } catch (error: any) {
            console.error("❌ Error fetching profile:", error);
            // axios interceptor จะจัดการ redirect ไป login อัตโนมัติ
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // ตรวจสอบว่า AuthContext พร้อมแล้วหรือยัง
        if (state.status === "authenticated") {
            fetchProfile();
        } else if (state.status === "unauthenticated") {
            window.location.href = "/login";
        }
        // ถ้ายัง loading ก็รอไปก่อน
    }, [state.status]);

    // Sample tickets (replace with real API call)
    const tickets = [
        {
            poster: "https://images.unsplash.com/photo-1711655371211-0e0e3d000480?q=80&w=664&auto=format&fit=crop",
            reserveId: "8101001259250007056700",
            title: "ROBERT BALTAZAR TRIO",
            venue: "MCC HALL, 3rd Floor, The Mall Lifestore Bangkapi",
            showDate: "2025-03-22",
            zone: "VIP",
            row: 7,
            column: 2,
            total: "5,000",
            type: "concert",
        },
    ];

    const filteredTickets = tickets
        .filter(
            (t) =>
                (category === "all" || t.type === category) &&
                (t.title.toLowerCase().includes(query.toLowerCase()) ||
                    t.venue.toLowerCase().includes(query.toLowerCase()))
        )
        .sort((a, b) =>
            order === "newest"
                ? new Date(b.showDate).getTime() - new Date(a.showDate).getTime()
                : new Date(a.showDate).getTime() - new Date(b.showDate).getTime()
        );

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
                            category={category}
                            onCategoryChange={setCategory}
                            order={order}
                            onOrderChange={setOrder}
                            search={query}
                            onSearchChange={setQuery}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {filteredTickets.map((ticket) => (
                        <EventCard
                            key={ticket.reserveId}
                            cover={ticket.poster}
                            dateRange={ticket.showDate}
                            title={ticket.title}
                            venue={ticket.venue}
                            onClick={() => setSelectedTicket(ticket)}
                        />
                    ))}
                </div>
            </div>

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