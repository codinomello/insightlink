import type { ActivityReport, AuthUser } from '@/types';
import { request } from './http';

export const listUsers = () => request<AuthUser[]>('/admin/users');

export const createUser = (payload: { nome: string; username: string; password: string; email?: string; role: 'admin' | 'user' }) =>
  request<AuthUser>('/admin/users', { method: 'POST', body: payload });

export const updateUser = (
  id: string,
  payload: Partial<{ nome: string; email: string | null; role: 'admin' | 'user'; ativo: boolean; password: string }>,
) => request<AuthUser>(`/admin/users/${id}`, { method: 'PUT', body: payload });

export const deleteUser = (id: string) => request<{ deleted: string }>(`/admin/users/${id}`, { method: 'DELETE' });

export const getActivity = () => request<ActivityReport>('/admin/activity');
