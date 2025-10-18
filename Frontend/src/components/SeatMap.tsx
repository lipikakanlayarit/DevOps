// src/components/SeatMap.tsx
import { Armchair } from "lucide-react";

export type Zone = {
    id: number | string;
    name: string;
    rows: number;
    cols: number;
    price?: number | null;
    occupied?: Array<{ r: number; c: number }>;
};

const ROW_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];

export default function SeatMap({
                                    zones,
                                    selected = [],
                                    onPick,
                                    readOnly = false,
                                }: {
    zones: Zone[];
    selected?: Array<{ zoneId: string | number; r: number; c: number }>;
    onPick?: (zoneId: Zone["id"], r: number, c: number) => void;
    readOnly?: boolean;
}) {
    if (!zones || zones.length === 0) {
        return <div className="text-sm text-gray-600">ยังไม่ตั้งค่าผังที่นั่ง</div>;
    }

    const isSelected = (zoneId: string | number, r: number, c: number) =>
        selected.some(s => s.zoneId === zoneId && s.r === r && s.c === c);

    return (
        <div className="grid gap-6">
            {zones.map((z) => (
                <div key={z.id} className="rounded-2xl p-4 shadow border">
                    <div className="mb-4 font-semibold text-lg">
                        {z.name} — {z.rows}x{z.cols}
                        {typeof z.price === "number" ? <> • {z.price.toLocaleString()} THB</> : null}
                    </div>

                    {/* Scrollable container for small screens */}
                    <div className="overflow-x-auto -mx-4 px-4">
                        <div className="flex justify-center min-w-max">
                            <div className="inline-block">
                                {Array.from({ length: z.rows }).map((_, rIdx) => {
                                    const rowLabel = ROW_LABELS[rIdx] || String.fromCharCode(65 + rIdx);

                                    return (
                                        <div key={rIdx} className="flex items-center gap-2 md:gap-3 mb-2">
                                            {/* Left Label */}
                                            <div className="w-6 md:w-8 text-center text-xs md:text-sm font-medium text-gray-500 flex-shrink-0">
                                                {rowLabel}
                                            </div>

                                            {/* Seats */}
                                            <div className="flex gap-1 md:gap-2">
                                                {Array.from({ length: z.cols }).map((__, cIdx) => {
                                                    const taken = z.occupied?.some(o => o.r === rIdx && o.c === cIdx);
                                                    const selected = isSelected(z.id, rIdx, cIdx);

                                                    return (
                                                        <button
                                                            key={cIdx}
                                                            disabled={taken || readOnly}
                                                            onClick={() => onPick?.(z.id, rIdx, cIdx)}
                                                            className={`relative transition-all duration-200 flex-shrink-0 ${
                                                                taken
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "hover:scale-110 cursor-pointer"
                                                            }`}
                                                            aria-label={`Zone ${z.name} seat ${rowLabel}-${cIdx + 1}${taken ? " taken" : ""}`}
                                                        >
                                                            <Armchair
                                                                className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 ${
                                                                    selected
                                                                        ? "text-red-500"
                                                                        : taken
                                                                            ? "text-gray-400"
                                                                            : "text-blue-500 hover:text-blue-600"
                                                                }`}
                                                                strokeWidth={1.5}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Right Label */}
                                            <div className="w-6 md:w-8 text-center text-xs md:text-sm font-medium text-gray-500 flex-shrink-0">
                                                {rowLabel}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Scroll hint for mobile */}
                    <div className="mt-2 text-center text-xs text-gray-500 md:hidden">
                        ← Swipe to see all seats →
                    </div>
                </div>
            ))}
        </div>
    );
}