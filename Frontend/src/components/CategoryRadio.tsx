import React from "react";

type Option = {
  label: string;
  value: string;
};

type CategoryRadioProps = {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
};

export default function CategoryRadio({
  options,
  value,
  onChange,
}: CategoryRadioProps) {
  return (
    <div className="flex gap-2 justify-end w-fit">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              // ลด padding จาก px-4 py-2 → px-3 py-1.5
              // ลด font-size จาก text-sm → text-xs
              "px-3 py-1.5 rounded-full font-bold text-xs transition-colors",
              isActive
                ? "bg-[#FA3A2B] text-white"
                : "bg-[#1D1D1D] text-white hover:bg-[#333]",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
