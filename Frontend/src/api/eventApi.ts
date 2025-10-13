import axios from "./axiosClient";

export const getEventDetail = async (eventId: string | number) => {
  const res = await axios.get(`/api/events/${eventId}`);
  return res.data;
};

export const getSeating = async (eventId: string | number) => {
  const res = await axios.get(`/api/events/${eventId}/seating`);
  return res.data;
};

export const confirmBooking = async (eventId: string | number, seatIds: number[]) => {
  const res = await axios.post(`/api/events/${eventId}/confirm`, { seatIds });
  return res.data;
};

export const getMyTickets = async () => {
  const res = await axios.get(`/api/auth/my-tickets`);
  return res.data;
};
