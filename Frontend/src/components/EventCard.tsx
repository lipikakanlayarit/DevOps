export type EventCardProps = {
  cover: string;
  dateRange: string;
  title: string;
  venue: string;
  className?: string;
  onClick?: () => void;
};

export default function EventCard({
  cover,
  dateRange,
  title,
  venue,
  className = "",
  onClick,
}: EventCardProps) {
  return (
    <article
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={[
        "w-[220px] overflow-hidden border-2 border-neutral-700 bg-white",
        "shadow hover:shadow-md transition-shadow cursor-pointer",
        // 👇 hover ขยายขึ้นเล็กน้อย
        "transform-gpu transition-transform duration-200 hover:scale-[1.03] will-change-transform",
        className,
      ].join(" ")}
    >
      {/* Poster */}
      <img
        src={cover}
        alt={title}
        className="w-full aspect-[3/4] object-cover"
        draggable={false}
      />

      {/* Info */}
      <div className="p-3">
        <div className="text-[#FA3A2B] font-bold text-xs mb-1">{dateRange}</div>
        <h3 className="text-sm leading-snug font-bold uppercase text-black line-clamp-2">
          {title}
        </h3>
        <p className="text-xs text-neutral-600 mt-2">{venue}</p>
      </div>
    </article>
  );
}
