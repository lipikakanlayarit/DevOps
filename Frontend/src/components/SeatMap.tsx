// src/components/SeatMap.tsx
import React, { useEffect, useState } from "react";

export type Zone = {
    id: number | string;
    name: string;
    rows: number | string;
    cols: number | string;
    price?: number | null;
    occupied?: Array<{ r: number; c: number }>;
    color?: string;
    dbZoneId?: number | null;
    ticketTypeId?: number | null;
};

const ROW_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Props = {
    eventId?: number;
    zones?: Zone[];
    selected?: Array<{ zoneId: Zone["id"]; r: number; c: number }>;
    onPick?: (zoneId: Zone["id"], r: number, c: number) => void;
    readOnly?: boolean;
    effectiveStatus?: "ONSALE" | "OFFSALE" | "UPCOMING";
    aisleEvery?: number;
};

type FetchedSetup = {
    seatRows: number | string;
    seatColumns: number | string;
    zones: Array<{
        id: number | string;
        name?: string;
        code?: string;
        rows?: number | string;
        cols?: number | string;
        price?: number | null;
        occupiedSeats?: Array<{ r: number; c: number }>;
    }>;
    // BE ส่ง r/c แบบ 1-based → เราจะ -1 ให้เป็น 0-based
    occupiedSeatMap?: Array<{ seatId: number; zoneId: number | string; r: number; c: number }>;
};

function toInt(v: unknown, fallback = 0): number {
    const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
    return Number.isFinite(n) && n >= 0 ? n : fallback;
}

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

    useEffect(() => {
        setZones(propZones);
    }, [propZones]);

    useEffect(() => {
        if (!eventId) return;
        fetch(`/api/public/events/${eventId}/tickets/setup?t=${Date.now()}`, {
            credentials: "include",
            headers: { Accept: "application/json" },
        })
            .then(async (r) => r.json() as Promise<FetchedSetup>)
            .then((data) => {
                const globalRows = toInt(data.seatRows, 0);
                const globalCols = toInt(data.seatColumns, 0);

                const zonesWithOcc: Zone[] = (data.zones || []).map((z, idx) => {
                    // 🔧 สำคัญ: BE ส่ง 1-based → แปลงเป็น 0-based ให้ตรงกับ rIdx/cIdx ที่ใช้วาด
                    const occFromFlat =
                        (data.occupiedSeatMap || [])
                            .filter((o) => String(o.zoneId) === String(z.id))
                            .map((o) => ({ r: (o.r ?? 1) - 1, c: (o.c ?? 1) - 1 })) ?? [];

                    const occupied = [...(z.occupiedSeats || []), ...occFromFlat].reduce<
                        Array<{ r: number; c: number }>
                    >((acc, cur) => {
                        if (!acc.some((p) => p.r === cur.r && p.c === cur.c)) acc.push(cur);
                        return acc;
                    }, []);

                    return {
                        id: z.id,
                        name: z.name ?? z.code ?? `ZONE-${idx + 1}`,
                        rows: toInt(z.rows, globalRows),
                        cols: toInt(z.cols, globalCols),
                        price: z.price ?? null,
                        occupied,
                    };
                });

                setZones(zonesWithOcc);
            })
            .catch((err) => console.error("Fetch seat setup failed:", err));
    }, [eventId]);

    const sameId = (a: Zone["id"], b: Zone["id"]) => String(a) === String(b);

    const isSelected = (zoneId: Zone["id"], r: number, c: number) =>
        selected.some((s) => sameId(s.zoneId, zoneId) && s.r === r && s.c === c);

    if (!zones || zones.length === 0) {
        return <div className="text-sm text-gray-600">ยังไม่ตั้งค่าผังที่นั่ง</div>;
    }

    return (
        <div className="relative">
            {!purchasable && (
                <div className="absolute inset-0 z-10 grid place-items-center bg-black/35 rounded-xl">
                    <div className="px-3 py-1.5 rounded-full bg-white text-xs font-semibold shadow">
                        {effectiveStatus === "UPCOMING" ? "UPCOMING (Available on sale start)" : "OFFSALE"}
                    </div>
                </div>
            )}

            <div className={`${!purchasable ? "pointer-events-none opacity-60" : ""}`}>
                <div className="mx-auto mb-3 w-full max-w-[520px]">
                    <div className="mx-auto w-full rounded-lg bg-black text-white text-center font-semibold py-2">
                        STAGE
                    </div>
                </div>

                <div className="grid gap-8">
                    {zones.map((z) => {
                        const rows = toInt(z.rows, 0);
                        const cols = toInt(z.cols, 0);
                        const aisleEveryCols = Math.max(1, (aisleEvery ?? Math.floor((cols || 1) / 2)) || 1);
                        const baseColor = z.color || "#a88df1";

                        return (
                            <div key={String(z.id)} className="rounded-2xl p-4 shadow border bg-white">
                                <div className="mb-4 font-semibold text-lg text-gray-800">
                                    {z.name}{" "}
                                    {typeof z.price === "number" && (
                                        <span className="text-red-600">• ฿{z.price.toLocaleString()}</span>
                                    )}
                                </div>

                                <div className="overflow-x-auto -mx-4 px-4">
                                    <div className="flex justify-center min-w-max">
                                        <div className="inline-block">
                                            {Array.from({ length: rows }).map((_, rIdx) => {
                                                const rowLabel = ROW_LABELS[rIdx] || String.fromCharCode(65 + rIdx);

                                                return (
                                                    <div key={rIdx} className="flex items-center gap-3 mb-3">
                                                        <div className="w-6 text-center text-xs md:text-sm font-medium text-gray-700 flex-shrink-0">
                                                            {rowLabel}
                                                        </div>

                                                        <div className="flex gap-2">
                                                            {Array.from({ length: cols }).map((__, cIdx) => {
                                                                const taken = z.occupied?.some((o) => o.r === rIdx && o.c === cIdx) ?? false;
                                                                const chosen = isSelected(z.id, rIdx, cIdx);
                                                                const shouldAisle = aisleEveryCols > 0 && cIdx > 0 && cIdx % aisleEveryCols === 0;
                                                                const style = taken ? {} : { backgroundColor: baseColor, borderColor: baseColor };

                                                                return (
                                                                    <React.Fragment key={cIdx}>
                                                                        {shouldAisle && <div className="w-4 md:w-5 lg:w-6" aria-hidden />}
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
                                                                            title={`Zone ${z.name} • Row ${rowLabel} • Seat ${cIdx + 1}${
                                                                                taken ? " — occupied" : chosen ? " — selected" : ""
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
