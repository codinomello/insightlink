import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as api from '../lib/api';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (nome: string, username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
  setUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    api.setAuthToken(null);
    setUserState(null);
  }, []);

  useEffect(() => {
    api.setUnauthorizedHandler(() => {
      setUserState(null);
      api.setAuthToken(null);
    });
    return () => api.setUnauthorizedHandler(null);
  }, []);

  // Ao montar, se já houver um token salvo, valida a sessão buscando o perfil.
  useEffect(() => {
    const token = api.getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((res) => setUserState(res.data))
      .catch(() => {
        api.setAuthToken(null);
        setUserState(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const res = await api.login(username, password);
    api.setAuthToken(res.data.token);
    setUserState(res.data.user);
  }, []);

  const register = useCallback(async (nome: string, username: string, password: string, email?: string) => {
    const res = await api.register({ nome, username, password, email });
    api.setAuthToken(res.data.token);
    setUserState(res.data.user);
  }, []);

  const refreshMe = useCallback(async () => {
    const res = await api.getMe();
    setUserState(res.data);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === 'admin',
      login,
      register,
      logout,
      refreshMe,
      setUser: setUserState,
    }),
    [user, loading, login, register, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>.');
  return ctx;
}
