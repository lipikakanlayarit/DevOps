// src/features/auth/types.ts
export type Role = "USER" | "ADMIN" | "ORGANIZER";

export type User = {
  id: string;
  username: string;
  role: Role;
};

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "unauthenticated"; user: null }
  | { status: "authenticated"; user: User };
