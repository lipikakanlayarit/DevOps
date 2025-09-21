// src/features/auth/types.ts
export type Role = "ADMIN" | "ORGANIZER" | "USER" | "GUEST";

export type User = {
  id: string;
  username: string;
  role: Role;
  avatarUrl?: string; 
};

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "unauthenticated"; user: null }
  | { status: "authenticated"; user: User };
