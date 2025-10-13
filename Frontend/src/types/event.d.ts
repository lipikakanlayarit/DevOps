export type EventDetail = {
  id: number;
  eventName: string;
  description?: string;
  categoryId?: number;
  startDatetime?: string; // ISO string
  endDatetime?: string;
  venueName?: string;
  venueAddress?: string;
  maxCapacity?: number;
  status?: string;
};
