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
    <div className="flex gap-2">
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              "px-4 py-2 rounded-full font-bold text-sm transition-colors",
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
