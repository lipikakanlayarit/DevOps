import React from "react";

type SearchBarProps = {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  width?: string;   // tailwind class เช่น "w-[400px]" หรือ "w-full"
  height?: string;  // tailwind class เช่น "h-12"
  className?: string;
};

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  width = "w-full",
  height = "h-12",
  className = "",
}: SearchBarProps) {
  return (
    <div
      className={`flex items-center border-2 border-black rounded-full px-4  ${width} ${height} ${className}`}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent focus:outline-none text-black placeholder-gray-600"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-5 h-5 text-black"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="8" strokeWidth="2" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
      </svg>
    </div>
  );
}
