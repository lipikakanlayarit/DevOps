import React from "react";
import { Link, type To } from "react-router-dom";

type OutlineButtonProps = {
  children: React.ReactNode;
  to?: To;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
};

export default function OutlineButton({
  children,
  to,
  onClick,
  type = "button",
  disabled = false,
  className = "",
}: OutlineButtonProps) {
  const base =
    "inline-flex items-center justify-center px-6 py-2 rounded-full font-extrabold uppercase " +
    "border-2 border-black text-black bg-transparent " +
    "hover:bg-black hover:text-white transition-colors " +
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
