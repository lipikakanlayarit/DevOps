import { api } from '@/lib/api';

export type LoginReq = { username: string; password: string };
export type LoginRes = { user: { id: string; username: string; role: 'USER'|'ADMIN'|'ORGANIZER' }, token: string };

export const login = (body: LoginReq) => api<LoginRes>('/auth/login', {
  method: 'POST',
  body: JSON.stringify(body),
});

export const me = () => api<LoginRes['user']>('/auth/me', { method: 'GET' });
export const logout = () => api<void>('/auth/logout', { method: 'POST' });