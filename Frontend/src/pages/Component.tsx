import { useState } from "react";
import { useAuth } from "@/features/auth/AuthContext";
import PosterCard from "@/components/PosterCard";
import EventCard from "@/components/EventCard";
import TicketCard from "@/components/TicketCard";
import PrimaryButton from "@/components/PrimaryButton";
import SecondaryButton from "@/components/SecondaryButton";
import OutlineButton from "@/components/OutlineButton";
import CategoryRadio from "@/components/CategoryRadio";
import SearchBar from "@/components/SearchBar";
import OrderToggle from "@/components/OrderToggle";
import Footer from "@/components/Footer";


const MOCK_POSTERS = [
  { id: 1, dateLabel: "[2025.07.27]", title: "VICTIM by INTROVE…", imageUrl: "https://picsum.photos/id/1015/480/640" },
  { id: 2, dateLabel: "[2025.07.27]", title: "The Silver Birds", imageUrl: "https://picsum.photos/id/1016/480/640" },
  { id: 3, dateLabel: "[2025.07.27]", title: "Creative Poster Exhibition", imageUrl: "https://picsum.photos/id/1024/480/640" },
  { id: 4, dateLabel: "[2025.07.27]", title: "Robert Baltazar Trio", imageUrl: "https://picsum.photos/id/1025/480/640" },
];

export default function Home() {
  const { state, loginAs, logout } = useAuth();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"newest" | "oldest">("newest");

  return (
    <>
      {/* เนื้อหาหน้า: มี padding */}
      <main className="space-y-6 p-6">
        <h1 className="text-2xl font-bold">Home</h1>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => loginAs("USER", "Admin123")} className="px-3 py-1.5 rounded bg-blue-600 text-white">
            Login as USER
          </button>
          <button onClick={() => loginAs("ADMIN", "Admin123")} className="px-3 py-1.5 rounded bg-emerald-600 text-white">
            Login as ADMIN
          </button>
          <button onClick={() => loginAs("ORGANIZER", "Organize")} className="px-3 py-1.5 rounded bg-purple-600 text-white">
            Login as ORGANIZER
          </button>
          <button onClick={logout} className="px-3 py-1.5 rounded bg-gray-800 text-white">
            Logout (GUEST)
          </button>
        </div>

        <pre className="bg-white p-3 rounded border overflow-auto">
          {JSON.stringify(state, null, 2)}
        </pre>

        <div className="flex gap-3">
          <PrimaryButton to="/events">All Event</PrimaryButton>
          <PrimaryButton to="/organizer">Organizer</PrimaryButton>
          <PrimaryButton to="/events?type=concert">Concert</PrimaryButton>
          <PrimaryButton to="/events?type=exhibition">Exhibition</PrimaryButton>
        </div>

        <div className="flex gap-3">
          <OutlineButton to="/organizer">Organizer</OutlineButton>
          <OutlineButton to="/about">About</OutlineButton>
        </div>

        <div className="flex gap-4">
          <SecondaryButton>View Detail</SecondaryButton>
          <SecondaryButton to="/more-info">More Info</SecondaryButton>
        </div>

        <div className="p-6">
          <CategoryRadio
            options={[
              { label: "All", value: "all" },
              { label: "Concert", value: "concert" },
              { label: "Seminar", value: "seminar" },
              { label: "Exhibition", value: "exhibition" },
            ]}
            value={category}
            onChange={setCategory}
          />
          <div className="mt-4 text-white">
            Selected: <span className="font-bold">{category}</span>
          </div>
        </div>

        <div className="p-6">
          <OrderToggle value={order} onChange={setOrder} />
  
        </div>

        <div className="p-6 space-y-6">
          {/* SearchBar แบบเต็มความกว้าง */}
          <SearchBar value={query} onChange={setQuery} />

          {/* SearchBar กำหนดขนาดเอง */}
          <SearchBar
            value={query}
            onChange={setQuery}
            width="w-[400px]"
            height="h-14"
            placeholder="Search events..."
          />
        </div>

        <div className="p-6">
          <EventCard
            cover="https://picsum.photos/id/1025/600/800"
            dateRange="22 Mar - 30 Mar"
            title="ROBERT BALTAZAR TRIO THE CONCERT"
            venue="Paragon hall"
          />
        </div>

        <div className="p-6">
          <TicketCard
            poster="https://picsum.photos/id/1027/400/600"
            reserveId="8101001259250007056700"
            title="ROBERT BALTAZAR TRIO"
            venue="MCC HALL, 3rd Floor, The Mall Lifestore Bangkapi"
            showDate="Saturday, March 22"
            zone="VIP"
            row={7}
            column={2}
            total="5,000"
          />
        </div>



        {/* แถบโปสเตอร์ (ยังอยู่ในคอนเทนเนอร์) */}
        <section className="overflow-x-auto px-2 py-4 snap-x snap-mandatory flex gap-4">
          {MOCK_POSTERS.map((p) => (
            <PosterCard key={p.id} {...p} />
          ))}
        </section>
      </main>

      {/* ฟุตเตอร์เต็มจอ: อยู่นอก container */}
      <Footer />
    </>
  );
}
