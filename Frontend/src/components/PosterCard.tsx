type PosterCardProps = {
  dateLabel: string;           // เช่น "[2025.07.27]"
  title: string;               // caption ด้านล่าง
  imageUrl: string;            // โปสเตอร์
  className?: string;
  onClick?: () => void;
};

export default function PosterCard({
  dateLabel,
  title,
  imageUrl,
  className = "",
  onClick,
}: PosterCardProps) {
  return (
    <article
      onClick={onClick}
      className={[
        "relative shrink-0 w-[220px] overflow-hidden",
        "bg-white cursor-pointer group",
        className,
      ].join(" ")}
      aria-label={title}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
    >
      {/* date label - positioned above poster */}
      <div className="px0 py-1 text-[13px] font-bold text-black text-left">
        {dateLabel}
      </div>

      {/* poster with black border */}
      <div className="relative border-2 border-black bg-white">
        {/* main poster image */}
        <div className="relative w-full h-[280px]">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* title caption at bottom with black border */}
        <div className="bg-white px-3 py-2 border-t-2 border-black">
          <p className="text-[13px] font-medium text-black truncate leading-tight">
            {title}
          </p>
        </div>
      </div>
    </article>
  );
}