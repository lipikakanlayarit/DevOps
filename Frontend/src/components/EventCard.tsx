// src/components/EventCard.tsx
export type EventCardProps = {
    cover: string;
    dateRange: string;
    title: string;
    venue: string;
    effectiveStatus?: "ONSALE" | "OFFSALE" | "UPCOMING";
    className?: string;
    onClickGetTicket?: () => void; // นำทางไป /eventselect/:id
};

export default function EventCard({
                                      cover,
                                      dateRange,
                                      title,
                                      venue,
                                      effectiveStatus = "OFFSALE",
                                      className = "",
                                      onClickGetTicket,
                                  }: EventCardProps) {
    const status = (effectiveStatus || "OFFSALE").toUpperCase() as
        | "ONSALE"
        | "OFFSALE"
        | "UPCOMING";

    // ให้คลิกทั้งการ์ดได้เมื่อ ONSALE/UPCOMING
    const cardClickable = status !== "OFFSALE" && !!onClickGetTicket;
    const handleCardClick = () => {
        if (cardClickable && onClickGetTicket) onClickGetTicket();
    };

    return (
        <article
            onClick={handleCardClick}
            className={[
                "w-[220px] overflow-hidden border-2 border-neutral-700 bg-white",
                "shadow transition-all",
                cardClickable ? "cursor-pointer hover:shadow-md" : "cursor-default",
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
            <div className="p-3 space-y-2">
                <div className="text-[#FA3A2B] font-bold text-xs">{dateRange}</div>
                <h3 className="text-sm leading-snug font-bold uppercase text-black line-clamp-2">
                    {title}
                </h3>
                <p className="text-xs text-neutral-600">{venue}</p>

                {/* Action */}
                <div className="pt-1">
                    {status === "ONSALE" ? (
                        <button
                            className="w-full rounded-md bg-black text-white text-xs py-1.5 hover:opacity-90"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClickGetTicket?.();
                            }}
                        >
                            Get Ticket
                        </button>
                    ) : status === "UPCOMING" ? (
                        // ✅ คลิกได้ แต่ยังคงหน้าตาเทา (ไม่ disabled)
                        <button
                            className="w-full rounded-md bg-neutral-200 text-neutral-700 text-xs py-1.5 hover:opacity-90"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClickGetTicket?.();
                            }}
                        >
                            COMING SOON
                        </button>
                    ) : (
                        <button
                            className="w-full rounded-md border text-xs py-1.5 cursor-not-allowed"
                            disabled
                        >
                            Offsale
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}