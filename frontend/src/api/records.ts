import type { Project } from '@/types';
import { request } from './http';

export const getProjects = (params: Record<string, string | undefined> = {}) => request<Project[]>('/projects', { params });

export const createProject = (payload: Partial<Project>) => request<Project>('/projects', { method: 'POST', body: payload });

export const editProject = (id: string | number, payload: Partial<Project>) =>
  request<Project>(`/projects/${id}`, { method: 'PUT', body: payload });

export const deleteProject = (id: string | number) => request<{ deleted: string }>(`/projects/${id}`, { method: 'DELETE' });

export const clearProjects = () => request<{ cleared: boolean }>('/projects', { method: 'DELETE' });

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return request<{ imported: number }>('/upload', { method: 'POST', body: form });
};
