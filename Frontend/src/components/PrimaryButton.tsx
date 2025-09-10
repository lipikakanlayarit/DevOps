// src/components/PrimaryButton.tsx
import React from "react";
import { Link, type To } from "react-router-dom";

type PrimaryButtonProps = {
  children: React.ReactNode;
  to?: To;                     // <— ใช้สำหรับระบุปลายทาง
  onClick?: () => void;        // ถ้าอยากทำอย่างอื่นตอนคลิก
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
};

export default function PrimaryButton({
  children,
  to,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: PrimaryButtonProps) {
  const base =
    "inline-flex items-center justify-center px-6 py-2 rounded-full " +
    "font-extrabold uppercase bg-[#FA3A2B] text-white " +
    "hover:bg-[#e13427] transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

  // ถ้ามี `to` ให้เรนเดอร์เป็น <Link> แทนปุ่ม
  if (to) {
    return (
      <Link to={to} className={`${base} ${className}`} aria-disabled={disabled}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${className}`}
    >
      {children}
    </button>
  );
}
