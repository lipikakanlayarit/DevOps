import React from "react";
import { Link, type To } from "react-router-dom";

type SecondaryButtonProps = {
  children: React.ReactNode;
  to?: To;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
};

export default function SecondaryButton({
  children,
  to,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: SecondaryButtonProps) {
  const base =
    "inline-flex items-center justify-center px-6 py-2 rounded-full font-extrabold " +
    "bg-[#DBDBDB] text-black " +
    "hover:bg-[#c4c4c4] transition-colors " +
    "disabled:opacity-60 disabled:cursor-not-allowed";

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
