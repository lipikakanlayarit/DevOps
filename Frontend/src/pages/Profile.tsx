// Home.tsx 
import React, { useState } from "react";
import TicketCard from "@/components/TicketCard";
import EventCard from "@/components/EventCard";
import EventToolbar from "@/components/EventToolbar"; // ✅ ใช้ Toolbar ใหม่

// ---------------- ProfileCard ----------------
function ProfileCard({ onOpenEdit }: { onOpenEdit: () => void }) {
  return (
    <div className="w-72 h-[450px] bg-white border rounded-lg shadow p-4 flex flex-col items-center relative">
      {/* จุดแดงมุมขวาบน */}
      <button
        onClick={onOpenEdit}
        className="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full cursor-pointer"
      ></button>

      {/* Avatar */}
      <div className="w-32 h-32 rounded-full bg-gray-200 mb-4"></div>

      {/* Email */}
      <p className="text-gray-500 mb-6">Nurat_lnwza@gmail.com</p>

      {/* ข้อมูลโปรไฟล์ */}
      <div className="w-full space-y-3">
        <div>
          <p className="text-gray-400 text-sm">Name</p>
          <p className="font-medium">Thidapon Chaokuwiang</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Phone Number</p>
          <p className="font-medium">066 646 2988</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Date of Birth</p>
          <p className="font-medium">12 January 1998</p>
        </div>
        <div>
          <p className="text-gray-400 text-sm">Gender</p>
          <p className="font-medium">Not Prefer</p>
        </div>
      </div>
    </div>
  );
}

// ---------------- Popup Form ----------------
function EditProfilePopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-white/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg w-[700px] p-8">
        <div className="flex gap-8">
          {/* Avatar + Change Picture */}
          <div className="flex flex-col items-center">
            <div className="w-32 h-32 rounded-full bg-gray-300 mb-4"></div>
            <button className="bg-red-500 text-white px-4 py-2 rounded-full text-sm">
              Change Picture
            </button>
          </div>

          {/* Form */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            {["First Name", "Last Name", "Email", "Phone Number", "Gender", "Date of Birth"].map(
              (label, i) => (
                <div key={i}>
                  <label className="block text-sm text-gray-600 mb-1">{label}</label>
                  <input className="w-full border rounded-lg px-3 py-2" placeholder="Value" />
                </div>
              )
            )}
          </div>
        </div>

        {/* Save / Cancel */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={onClose}
            className="bg-gray-300 text-black font-semibold px-6 py-2 rounded-full"
          >
            Cancel
          </button>
          <button className="bg-red-500 text-white font-semibold px-6 py-2 rounded-full">
            Save
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
      <div className="w-[780px] max-w-full  bg-white overflow-hidden text-black shadow-lg relative">
        {/* ปุ่มปิด X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black hover:text-gray-600 text-3xl z-10 font-bold leading-none w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>

        {/* ใช้ TicketCard แบบเต็มขนาด */}
        <div className="w-full h-auto">
          <TicketCard {...ticket} />
        </div>
      </div>
    </div>
  );
}

// ---------------- Home ----------------
export default function Home() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  const [showEdit, setShowEdit] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // sample tickets
  const tickets = [
    {
      poster:
        "https://images.unsplash.com/photo-1711655371211-0e0e3d000480?q=80&w=664&auto=format&fit=crop",
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
    {
      poster:
        "https://images.unsplash.com/photo-1584448141569-69f342da535c?w=600&auto=format&fit=crop",
      reserveId: "8101001259250007056701",
      title: "MONTREAL WINTER",
      venue: "Paragon hall",
      showDate: "2025-03-23",
      zone: "VIP",
      row: 5,
      column: 10,
      total: "4,500",
      type: "concert",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1584448097764-374f81551427?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      reserveId: "8101001259250007056702",
      title: "THE SILVER BROS",
      venue: "Paragon hall",
      showDate: "2025-03-23",
      zone: "VIP",
      row: 5,
      column: 10,
      total: "4,500",
      type: "seminar",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1673506073257-c316106369d4?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDZ8fHxlbnwwfHx8fHw%3D",
      reserveId: "8101001259250007056703",
      title: "FOREST SERVICE",
      venue: "Paragon hall",
      showDate: "2025-03-27",
      zone: "Premium",
      row: 2,
      column: 8,
      total: "4,800",
      type: "exhibition",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1622817245531-a07976979cf5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29uY2VydCUyMHRpY2tldHxlbnwwfHwwfHx8MA%3D%3D",
      reserveId: "8101001259250007056700",
      title: "THE VETVE",
      venue: "MCC HALL, 3rd Floor, The Mall Lifestore Bangkapi",
      showDate: "2025-03-22",
      zone: "VIP",
      row: 7,
      column: 2,
      total: "5,000",
      type: "concert",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1571847140471-1d7766e825ea?q=80&w=733&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      reserveId: "8101001259250007056701",
      title: "VICTIM FILMS",
      venue: "Paragon hall",
      showDate: "2025-03-23",
      zone: "VIP",
      row: 5,
      column: 10,
      total: "4,500",
      type: "concert",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1734055995662-de9e08b05793?w=600&auto=format&fit=crop",
      reserveId: "8101001259250007056702",
      title: "THE REWE",
      venue: "Paragon hall",
      showDate: "2025-03-23",
      zone: "VIP",
      row: 5,
      column: 10,
      total: "4,500",
      type: "seminar",
    },
    {
      poster:
        "https://images.unsplash.com/photo-1739476479418-148b996e78bb?q=80&w=735&auto=format&fit=crop",
      reserveId: "8101001259250007056703",
      title: "HARDCORE",
      venue: "Paragon hall",
      showDate: "2025-03-27",
      zone: "Premium",
      row: 2,
      column: 8,
      total: "4,800",
      type: "exhibition",
    },
  ];

  // filter + search + order
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

  return (
    <div className="flex p-6 gap-10 bg-gray-100 min-h-screen">
      {/* Sidebar */}
      <div className="ml-6 mr-5">
        <ProfileCard onOpenEdit={() => setShowEdit(true)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Title + Toolbar */}
        <div className="flex justify-between items-center mb-6 w-full">
          {/* Title */}
          <h1 className="text-5xl font-extrabold">My Ticket</h1>

          {/* Toolbar */}
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

        {/* EventCards */}
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

      {/* Popup: Profile Edit */}
      {showEdit && <EditProfilePopup onClose={() => setShowEdit(false)} />}

      {/* Popup: Ticket Card */}
      {selectedTicket && (
        <TicketPopup ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
      )}
    </div>
  );
}
