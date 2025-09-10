export type Role = 'GUEST' | 'USER' | 'ADMIN' | 'ORGANIZER';

export interface AuthUser {
  id: string;
  username: string;
  role: Role;
}

export interface AuthState {
  status: 'unauthenticated' | 'authenticated';
  user: AuthUser | null;
}
