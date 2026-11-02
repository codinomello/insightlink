import type { AuthUser } from '@/types';
import { request } from './http';

export interface AuthResponse { token: string; user: AuthUser }

export const login = (username: string, password: string) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body: { username, password } });

export const getMe = () => request<AuthUser>('/auth/me');

export const updateMe = (payload: { nome?: string; email?: string | null; senha_atual?: string; nova_senha?: string }) =>
  request<AuthUser>('/auth/me', { method: 'PUT', body: payload });
