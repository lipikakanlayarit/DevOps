export type EventCardProps = {
  cover: string;        // URL โปสเตอร์
  dateRange: string;    // "22 Mar - 30 Mar"
  title: string;        // "ROBERT BALTAZAR TRIO THE CONCERT"
  venue: string;        // "Paragon hall"
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
        // ขนาดใกล้เคียงภาพตัวอย่าง
        "w-[300px] rounded-md overflow-hidden border-2 border-neutral-700 bg-white",
        "shadow-sm hover:shadow-md transition-shadow cursor-pointer",
        className,
      ].join(" ")}
    >
      {/* โปสเตอร์ */}
      <img
        src={cover}
        alt={title}
        className="w-full aspect-[3/4] object-cover"
        draggable={false}
      />

      {/* ส่วนข้อมูล */}
      <div className="p-4">
        <div className="text-[#FA3A2B] font-extrabold mb-1">
          {dateRange}
        </div>

        <h3 className="text-[17px] leading-tight font-extrabold uppercase text-black">
          {title}
        </h3>

        <p className="text-[15px] text-neutral-600 mt-3">{venue}</p>
      </div>
    </article>
  );
}
