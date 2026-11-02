/**
 * Cliente HTTP mínimo sobre `fetch`: injeta o token, serializa JSON/FormData,
 * padroniza erros em `ApiError` e avisa o app quando a sessão expira (401).
 */

const TOKEN_KEY = 'insightlink_token';
const BASE = '/api';

export class ApiError extends Error {
  /** `status` 0 = sem resposta do servidor (rede, backend fora do ar). */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
  get isNetwork() { return this.status === 0; }
}

const read = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };

let token: string | null = read();
let onUnauthorized: (() => void) | null = null;

export const getAuthToken = () => token;

export const setAuthToken = (value: string | null) => {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* sem storage */ }
};

/** Chamado quando o servidor recusa a sessão atual (token expirado/inválido). */
export const setUnauthorizedHandler = (fn: (() => void) | null) => { onUnauthorized = fn; };

const fallbackMessage = (status: number) => {
  if (status === 404) return 'Rota não encontrada. O backend pode estar desatualizado — reconstrua com "docker compose up --build".';
  if (status === 403) return 'Você não tem permissão para esta ação.';
  if (status >= 500) return `O servidor respondeu com erro ${status}. Veja os logs do backend.`;
  return `Não foi possível concluir a requisição (erro ${status}).`;
};

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | undefined>;
  as?: 'json' | 'blob';
}

export async function request<T = unknown>(path: string, { method = 'GET', body, params, as = 'json' }: RequestOptions = {}): Promise<T> {
  const query = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString()
    : '';

  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}${query === '?' ? '' : query}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 0);
  }

  if (!res.ok) {
    let message: string | undefined;
    try { message = (await res.json())?.error; } catch { /* resposta não-JSON (ex.: HTML de proxy) */ }
    if (res.status === 401 && token && !path.startsWith('/auth/login')) onUnauthorized?.();
    throw new ApiError(message || fallbackMessage(res.status), res.status);
  }

  return (as === 'blob' ? res.blob() : res.json()) as Promise<T>;
}

/** Texto de erro amigável para exibir ao usuário. */
export const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError && err.message ? err.message : fallback;
