// src/components/TicketCard.tsx
import posterFallback from "@/assets/poster.png";

type TicketCardProps = {
    poster: string;
    reserveId: string;
    title: string;
    venue: string;
    showDate: string; // e.g. "Saturday, March 22"
    zone: string;     // e.g. "VIP"
    row: string | number;
    column: string | number;
    total: string | number; // e.g. "5,000"
    className?: string;
};

export default function TicketCard({
                                       poster,
                                       reserveId,
                                       title,
                                       venue,
                                       showDate,
                                       zone,
                                       row,
                                       column,
                                       total,
                                       className = "",
                                   }: TicketCardProps) {
    // ใช้รูปจาก props ถ้ามี ไม่งั้น fallback
    const src = poster && poster.trim().length > 0 ? poster : posterFallback;

    return (
        <div
            className={[
                "w-[780px] max-w-full border-4 border-black bg-white",
                "overflow-hidden text-black shadow-lg",
                className,
            ].join(" ")}
        >
            {/* Main layout: poster on left, content on right */}
            <div className="flex h-[350px]">
                {/* Left side - Poster */}
                <div className="w-[260px] bg-white border-r-4 border-black">
                    <div className="w-full h-full relative bg-white overflow-hidden">
                        <img
                            src={src}
                            alt={title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = posterFallback;
                            }}
                        />
                    </div>
                </div>

                {/* Right side - Content */}
                <div className="flex-1 bg-gray-200 flex flex-col">
                    {/* Reserve ID section */}
                    <div className="bg-gray-200 p-4 border-b-4 border-black">
                        <div className="text-red-500 font-bold text-lg mb-2">Reserve ID</div>
                        <div className="text-2xl font-bold tracking-wide">{reserveId}</div>
                    </div>

                    {/* Title and venue section */}
                    <div className="bg-gray-200 p-4 border-b-4 border-black">
                        <div className="font-bold text-xl mb-3">{title}</div>

                        <div className="flex items-start gap-6 text-sm text-gray-700">
                            <div className="flex items-start gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="mt-0.5"
                                >
                                    <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
                                    <circle cx="12" cy="11" r="2.5" />
                                </svg>
                                <div>
                                    <div className="font-medium">{venue}</div>
                                </div>
                            </div>

                            <div className="flex items-start gap-2">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="mt-0.5"
                                >
                                    <rect x="3" y="4" width="18" height="18" rx="2" />
                                    <line x1="16" y1="2" x2="16" y2="6" />
                                    <line x1="8" y1="2" x2="8" y2="6" />
                                    <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <div>
                                    <div className="text-gray-600 text-xs">Show Date</div>
                                    <div className="font-medium">{showDate || "-"}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom section - ZONE/ROW/COLUMN/TOTAL */}
                    <div className="flex bg-gray-200 flex-1">
                        <Cell big={zone} small="ZONE" />
                        <Cell big={row} small="ROW" />
                        <Cell big={column} small="COLUMN" />
                        <Cell big={total} small="TOTAL" isLast />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** helper cell */
function Cell({
                  big,
                  small,
                  isLast = false,
              }: {
    big: any;
    small: string;
    isLast?: boolean;
}) {
    return (
        <div
            className={`flex-1 p-4 bg-gray-200 ${
                !isLast ? "border-r-4 border-black" : ""
            } flex flex-col justify-center`}
        >
            <div className="text-4xl font-bold mb-2">{big}</div>
            <div className="text-sm font-bold text-gray-700 tracking-wider">
                {small}
            </div>
        </div>
    );
}
