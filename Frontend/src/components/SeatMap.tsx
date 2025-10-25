import React, { useEffect, useState } from "react";

export type Zone = {
    id: number | string;
    name: string;
    rows: number;
    cols: number;
    price?: number | null;
    /** เก้าอี้ที่ถูกจองแล้ว (0-based index) */
    occupied?: Array<{ r: number; c: number }>;
    /** สีของโซน (UI เท่านั้น) */
    color?: string;
};

const ROW_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Props = {
    eventId?: number; // ✅ เพิ่ม เพื่อ fetch เองได้
    zones?: Zone[];
    selected?: Array<{ zoneId: Zone["id"]; r: number; c: number }>;
    onPick?: (zoneId: Zone["id"], r: number, c: number) => void;
    readOnly?: boolean;
    effectiveStatus?: "ONSALE" | "OFFSALE" | "UPCOMING";
    aisleEvery?: number;
};

export default function SeatMap({
                                    eventId,
                                    zones: propZones = [],
                                    selected = [],
                                    onPick,
                                    readOnly = false,
                                    effectiveStatus = "OFFSALE",
                                    aisleEvery,
                                }: Props) {
    const [zones, setZones] = useState<Zone[]>(propZones);
    const purchasable = (effectiveStatus || "OFFSALE").toUpperCase() === "ONSALE";

    // ✅ ถ้ามี eventId ให้ fetch setup เอง
    useEffect(() => {
        if (!eventId) return;
        fetch(`/api/public/events/${eventId}/tickets/setup`)
            .then((r) => r.json())
            .then((data) => {
                // data.zones = zone array
                // data.occupiedSeatMap = [{ zoneId, r, c }]
                const zonesWithOcc = (data.zones || []).map((z: any) => {
                    const occ = (data.occupiedSeatMap || [])
                        .filter((o: any) => String(o.zoneId) === String(z.id))
                        .map((o: any) => ({ r: o.r, c: o.c }));
                    return { ...z, occupied: occ };
                });
                setZones(zonesWithOcc);
            })
            .catch((err) => console.error("Fetch seat setup failed:", err));
    }, [eventId]);

    // ✅ กันเคส zoneId เป็น number บ้าง string บ้าง
    const sameId = (a: Zone["id"], b: Zone["id"]) => String(a) === String(b);

    const isSelected = (zoneId: Zone["id"], r: number, c: number) =>
        selected.some((s) => sameId(s.zoneId, zoneId) && s.r === r && s.c === c);

    if (!zones || zones.length === 0) {
        return <div className="text-sm text-gray-600">ยังไม่ตั้งค่าผังที่นั่ง</div>;
    }

    return (
        <div className="relative">
            {/* overlay เมื่อซื้อไม่ได้ */}
            {!purchasable && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 rounded-xl">
                    <div className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold shadow">
                        {effectiveStatus === "UPCOMING"
                            ? "UPCOMING (Available on sale start)"
                            : "OFFSALE"}
                    </div>
                </div>
            )}

            <div className={`${!purchasable ? "pointer-events-none opacity-60" : ""}`}>
                {/* ป้าย STAGE */}
                <div className="mx-auto mb-3 w-full max-w-[520px]">
                    <div className="mx-auto w-full rounded-lg bg-black text-white text-center font-semibold py-2">
                        STAGE
                    </div>
                </div>

                {/* โซนต่าง ๆ */}
                <div className="grid gap-8">
                    {zones.map((z) => {
                        const aisleEveryCols = Math.max(1, (aisleEvery ?? Math.floor(z.cols / 2)) || 1);
                        const baseColor = z.color || "#a88df1";

                        return (
                            <div key={String(z.id)} className="rounded-2xl p-4 shadow border bg-white">
                                {/* ชื่อโซน + ราคา */}
                                <div className="mb-4 font-semibold text-lg text-gray-800">
                                    {z.name}{" "}
                                    {typeof z.price === "number" && (
                                        <span className="text-red-600">• ฿{z.price.toLocaleString()}</span>
                                    )}
                                </div>

                                <div className="overflow-x-auto -mx-4 px-4">
                                    <div className="flex justify-center min-w-max">
                                        <div className="inline-block">
                                            {Array.from({ length: z.rows }).map((_, rIdx) => {
                                                const rowLabel = ROW_LABELS[rIdx] || String.fromCharCode(65 + rIdx);

                                                return (
                                                    <div key={rIdx} className="flex items-center gap-3 mb-3">
                                                        {/* label ซ้าย */}
                                                        <div className="w-6 text-center text-xs md:text-sm font-medium text-gray-700 flex-shrink-0">
                                                            {rowLabel}
                                                        </div>

                                                        {/* ที่นั่ง */}
                                                        <div className="flex gap-2">
                                                            {Array.from({ length: z.cols }).map((__, cIdx) => {
                                                                const taken =
                                                                    z.occupied?.some(
                                                                        (o) => o.r === rIdx && o.c === cIdx
                                                                    ) ?? false;
                                                                const chosen = isSelected(z.id, rIdx, cIdx);
                                                                const shouldAisle =
                                                                    aisleEveryCols > 0 &&
                                                                    cIdx > 0 &&
                                                                    cIdx % aisleEveryCols === 0;
                                                                const style = taken
                                                                    ? {}
                                                                    : {
                                                                        backgroundColor: baseColor,
                                                                        borderColor: baseColor,
                                                                    };

                                                                return (
                                                                    <React.Fragment key={cIdx}>
                                                                        {shouldAisle && (
                                                                            <div className="w-4 md:w-5 lg:w-6" aria-hidden />
                                                                        )}
                                                                        <button
                                                                            disabled={taken || readOnly}
                                                                            onClick={() => onPick?.(z.id, rIdx, cIdx)}
                                                                            className={[
                                                                                "h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 rounded-full grid place-items-center transition-transform border",
                                                                                taken
                                                                                    ? "bg-black text-white border-black cursor-not-allowed"
                                                                                    : chosen
                                                                                        ? "text-white ring-2 ring-white/70 hover:scale-110"
                                                                                        : "text-transparent hover:scale-110",
                                                                            ].join(" ")}
                                                                            style={style}
                                                                            title={`Zone ${z.name} • Row ${rowLabel} • Seat ${
                                                                                cIdx + 1
                                                                            }${
                                                                                taken
                                                                                    ? " — occupied"
                                                                                    : chosen
                                                                                        ? " — selected"
                                                                                        : ""
                                                                            }`}
                                                                        >
                                                                            {taken ? (
                                                                                <span className="text-[10px] leading-none">×</span>
                                                                            ) : chosen ? (
                                                                                <span className="text-[11px] leading-none">✓</span>
                                                                            ) : (
                                                                                <span className="sr-only">seat</span>
                                                                            )}
                                                                        </button>
                                                                    </React.Fragment>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* label ขวา */}
                                                        <div className="w-6 text-center text-xs md:text-sm font-medium text-gray-700 flex-shrink-0">
                                                            {rowLabel}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
