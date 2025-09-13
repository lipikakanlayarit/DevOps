import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import Ordertoggle from "@/components/OrderToggle";
import CategoryRadio from "@/components/CategoryRadio";
import PrimaryButton from "@/components/PrimaryButton";
import { Link } from "react-router-dom";

// ====== demo ======
// ถ้าอยากให้เป็น “create event” ให้comment list event ให้เหลือแค่ const MOCK_EVENTS = [] แทน
const MOCK_EVENTS = [
  { id: "1", title: "RIIZE CONCERT TOUR [RIIZING LOUD] IN BANGKOK", category: "concert", updatedAt: "2025-08-01" },
  { id: "2", title: "RIIZE CONCERT TOUR [RIIZING LOUD] IN BANGKOK", category: "concert", updatedAt: "2025-07-28" },
  { id: "3", title: "RIIZE CONCERT TOUR [RIIZING LOUD] IN BANGKOK", category: "concert", updatedAt: "2025-07-20" },
];
// =================================

type Order = "newest" | "oldest";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<"all" | "concert" | "seminar" | "exhibition">("all");
  const [order, setOrder] = useState<Order>("newest");

  // TODO: แทนที่ MOCK_EVENTS ด้วยข้อมูลจริงของ organizer ที่ล็อกอินอยู่
  const [events] = useState(MOCK_EVENTS);
  const hasEvents = events.length > 0;

  // ฟิลเตอร์ + ค้นหา + เรียง
  const filtered = useMemo(() => {
    let list = [...events];

    if (category !== "all") {
      list = list.filter((e) => e.category === category);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((e) => e.title.toLowerCase().includes(q));
    }
    list.sort((a, b) =>
      order === "newest"
        ? new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        : new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    );
    return list;
  }, [events, category, searchQuery, order]);

  // ====== if dont Create yet  ======
  if (!hasEvents) {
    return (
      <div className="bg-[#DBDBDB] min-h-screen flex flex-col">
        {/* หมวดหมู่ */}
        <div className="mt-6 flex justify-end mr-4 sm:mr-6">
          <CategoryRadio
            options={[
              { label: "All", value: "all" },
              { label: "Concert", value: "concert" },
              { label: "Seminar", value: "seminar" },
              { label: "Exhibition", value: "exhibition" },
            ]}
            value={category}
            onChange={(v) => setCategory(v as any)}
          />
        </div>

        {/* Order + Search */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-4 mt-4 mr-4 sm:mr-6 px-4 sm:px-0">
          <Ordertoggle value={order} onChange={setOrder} />
          <div className="w-full sm:w-96">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events..." />
          </div>
        </div>

        {/* Create button */}
        <main className="flex-1 flex justify-center items-center px-4">
          <div className="text-center w-full max-w-sm">
            <PrimaryButton to="/eventdetail" className="w-full sm:w-auto">
              <Plus className="h-5 w-5 mr-3" />
              Create Event
            </PrimaryButton>
          </div>
        </main>
      </div>
    );
  }

  // ====== alr hv events ======
  return (
    <div className="bg-[#DBDBDB] min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 pb-10">
        
        <div className="flex items-start justify-between pt-10">
          <h1 className="text-[56px] leading-none font-extrabold text-[#1A1A1A]">All Event</h1>

          <div className="flex flex-col items-end gap-3">
            <CategoryRadio
              options={[
                { label: "All", value: "all" },
                { label: "Concert", value: "concert" },
                { label: "Seminar", value: "seminar" },
                { label: "Exhibition", value: "exhibition" },
              ]}
              value={category}
              onChange={(v) => setCategory(v as any)}
            />

            <div className="flex items-center gap-3">
              <Ordertoggle value={order} onChange={setOrder} />
              <div className="w-[320px]">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events..." />
              </div>
              <PrimaryButton to="/eventdetail" className="whitespace-nowrap">
                <Plus className="h-5 w-5 mr-2" />
                Create Event
              </PrimaryButton>
            </div>
          </div>
        </div>

        {/* event table */}
        <div className="mt-6 rounded-xl bg-white shadow-sm overflow-hidden">
          {/* หัวตาราง */}
          <div className="grid grid-cols-[1fr_140px] items-center px-6 py-4 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-900">Events</div>
            <div className="text-lg font-semibold text-gray-900 text-right">Action</div>
          </div>

          {/* แถวข้อมูล */}
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="grid grid-cols-[1fr_140px] items-center px-6 py-8 border-b last:border-b-0 border-gray-200"
            >
              <div className="text-[18px] text-gray-900">{ev.title}</div>
              <div className="text-right">
                <Link
                  to={`/events/${ev.id}`}
                  className="text-gray-800 hover:text-black underline-offset-2 hover:underline transition"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
