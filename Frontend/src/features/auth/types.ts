// src/features/auth/types.ts
export interface User {
    id: string;
    username: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    idCard?: string;
    companyName?: string;
    taxId?: string;
    address?: string;
    verificationStatus?: string;
}

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
    status: AuthStatus;
    user: User | null;
}