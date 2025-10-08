import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type EventDTO = {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  location?: string;
  startAt?: string; // ISO string
  endAt?: string;   // ISO string
  featured?: boolean;
};

export type Page<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export function useEvents(opts?: { page?: number; size?: number; q?: string }) {
  const [data, setData] = useState<Page<EventDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { page = 0, size = 12, q } = opts || {};

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      // ⬇️ baseURL คือ API_BASE ดังนั้นต้องใส่ /api นำหน้าเสมอ
      .get<Page<EventDTO>>("/api/events", { params: { page, size, q } })
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [page, size, q]);

  return { data, loading, error };
}

export function useFeaturedEvents(size = 8) {
  const [data, setData] = useState<EventDTO[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .get<EventDTO[]>("/api/events/featured", { params: { size } })
      .then((res) => alive && setData(res.data))
      .catch((err) => alive && setError(err))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [size]);

  return { data, loading, error };
}
