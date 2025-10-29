import { useState } from "react";

type Order = "newest" | "oldest";

type OrderToggleProps = {
  value?: Order;
  onChange?: (order: Order) => void;
};

export default function OrderToggle({
  value = "newest",
  onChange,
}: OrderToggleProps) {
  const [open, setOpen] = useState(false);

  const toggleOrder = (order: Order) => {
    onChange?.(order);
    setOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      {/* main button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 font-semibold text-[#1D1D1D] hover:text-[#FA3A2B] transition-colors"
      >
        {value === "newest" ? "Newest Event" : "Oldest Event"}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* dropdown */}
      {open && (
        <div className="absolute mt-2 w-40 bg-white border border-gray-300 rounded-md shadow-lg z-10">
          <button
            onClick={() => toggleOrder("newest")}
            className={`block w-full text-left px-4 py-2 text-sm ${
              value === "newest"
                ? "bg-[#FA3A2B] text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Newest Event
          </button>
          <button
            onClick={() => toggleOrder("oldest")}
            className={`block w-full text-left px-4 py-2 text-sm ${
              value === "oldest"
                ? "bg-[#FA3A2B] text-white"
                : "hover:bg-gray-100"
            }`}
          >
            Oldest Event
          </button>
        </div>
      )}
    </div>
  );
}
