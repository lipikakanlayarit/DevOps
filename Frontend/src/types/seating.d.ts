
export type SeatDTO = { seatId: number; label: string; number: number; available: boolean };
export type RowDTO = { rowId: number; label: string; seats: SeatDTO[] };
export type ZoneDTO = { zoneId: number; zoneName: string; price: string | null; rows: RowDTO[] };
export type SeatingResp = { eventId: number; zones: ZoneDTO[] };
