import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import { api, profileApi } from "@/lib/api";
import TicketCard from "@/components/TicketCard";
import EventCard from "@/components/EventCard";
import EventToolbar from "@/components/EventToolbar";

type Order = "newest" | "oldest";

interface UserProfile {
  id: number | string;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  idCard?: string;
}

interface TicketApiItem {
  reservedId: number;
  eventId: number;
  eventName: string;
  venueName: string;
  coverImageUrl?: string;
  startDatetime?: string;

  seatId?: number;
  zoneName?: string;
  rowLabel?: string;
  seatNumber?: number;

  ticketTypeName?: string;
  price?: number;
  paymentStatus?: string;
  confirmationCode?: string;
}

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
  const initials = useMemo(() => {
    const f = profile.firstName || "";
    const l = profile.lastName || "";
    return `${f.charAt(0)}${l.charAt(0)}` || "AW";
  }, [profile.firstName, profile.lastName]);

  return (
    <div className="w-72 h-[450px] bg-white border rounded-lg shadow p-4 flex flex-col items-center relative">
      <button
        onClick={onOpenEdit}
        className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full"
        title="Edit Profile"
      />
      <div className="w-32 h-32 rounded-full bg-gray-200 mb-4 flex items-center justify-center text-4xl font-bold text-gray-400">
        {initials}
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
        <div>
          <p className="text-gray-400 text-sm">ID Card</p>
          <p className="font-medium">{profile.idCard || "-"}</p>
        </div>
      </div>
    </div>
  );
}

function TicketPopup({
  ticket,
  onClose,
}: {
  ticket: any;
  onClose: () => void;
}) {
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

export default function Profile() {
  const { state } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<Order>("newest");

  const [tickets, setTickets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  const fetchProfile = async () => {
    const res = await profileApi.getProfile();
    setProfile(res.data);
  };

  const fetchTickets = async () => {
    const res = await api.get<{ tickets: TicketApiItem[] }>("/api/auth/my-tickets");
    const list = (res.data?.tickets || []).map((t) => {
      const date = t.startDatetime ? new Date(t.startDatetime) : null;
      const dateStr = date ? date.toISOString().slice(0, 10) : "";
      // ปั้น props ให้ EventCard + TicketCard
      return {
        reserveId: String(t.reservedId),
        cover: t.coverImageUrl,
        dateRange: dateStr,
        title: t.eventName,
        venue: t.venueName,

        // สำหรับป๊อปอัพ TicketCard
        poster: t.coverImageUrl,
        showDate: dateStr,
        zone: t.zoneName || (t.ticketTypeName ?? "-"),
        row: t.rowLabel,
        column: t.seatNumber,
        total: t.price ? Number(t.price).toLocaleString() : undefined,
        type: "concert", // ถ้าจะฟิลเตอร์จริง ค่อยเปลี่ยนตาม category ของ event
        __raw: t,
      };
    });

    // เรียง
    list.sort((a, b) =>
      order === "newest"
        ? (b.dateRange || "").localeCompare(a.dateRange || "")
        : (a.dateRange || "").localeCompare(b.dateRange || "")
    );

    setTickets(list);
  };

  useEffect(() => {
    if (state.status === "authenticated") {
      Promise.all([fetchProfile(), fetchTickets()]).finally(() =>
        setLoading(false)
      );
    } else if (state.status === "unauthenticated") {
      window.location.href = "/login";
    }
  }, [state.status]);

  // ฟิลเตอร์เบื้องต้น
  const filtered = tickets.filter(
    (t) =>
      (category === "all" || t.type === category) &&
      ((t.title || "").toLowerCase().includes(query.toLowerCase()) ||
        (t.venue || "").toLowerCase().includes(query.toLowerCase()))
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
        <ProfileCard profile={profile} onOpenEdit={() => {}} />
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6 w-full">
          <div className="flex items-baseline gap-4">
            <h1 className="text-5xl font-extrabold">My Ticket</h1>
            <span className="text-gray-500 text-lg">
              {/* แสดงจำนวนใบจริงตามที่นั่ง */}
              ({filtered.length} tickets)
            </span>
          </div>
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
              onOrderChange={(v) => {
                setOrder(v);
                // เรียงใหม่แบบง่าย ๆ ฝั่ง client
                setTickets((prev) =>
                  [...prev].sort((a, b) =>
                    v === "newest"
                      ? (b.dateRange || "").localeCompare(a.dateRange || "")
                      : (a.dateRange || "").localeCompare(b.dateRange || "")
                  )
                );
              }}
              search={query}
              onSearchChange={setQuery}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {filtered.map((t) => (
            <EventCard
              key={`${t.reserveId}-${t.row}-${t.column}-${t.dateRange}`}
              cover={t.cover}
              dateRange={t.dateRange}
              title={t.title}
              venue={t.venue}
              onClick={() => setSelected(t)}
            />
          ))}
        </div>
      </div>

      {selected && (
        <TicketPopup ticket={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
