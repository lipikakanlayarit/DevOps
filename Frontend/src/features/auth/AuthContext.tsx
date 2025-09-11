import React, { createContext, useContext, useMemo, useState } from 'react';
import type { AuthState, AuthUser, Role } from './types';

import * as AuthAPI from './auth.api';

type AuthContextValue = {
  state: AuthState;
  loginAs: (role: Role, username?: string) => void;
  loginViaBackend: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'unauthenticated',
    user: null,
  });

  const loginAs = (role: Role, username = role.toLowerCase()) => {
    const user: AuthUser = { id: crypto.randomUUID(), username, role };
    setState({ status: 'authenticated', user });
  };

  const logout = () => setState({ status: 'unauthenticated', user: null });

  const loginViaBackend = async (username: string, password: string) => {
    const res = await AuthAPI.login({ username, password });
    setState({ status: 'authenticated', user: res.user });
  };

  const value = useMemo(() => ({ state, loginAs, loginViaBackend, logout }), [state]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
