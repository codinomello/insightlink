export type UserRole = 'admin' | 'user';


export interface AuthUser {
  id: string;
  nome: string;
  username: string;
  email?: string | null;
  role: UserRole;
  ativo: boolean;
  criado_em?: string | null;
  ultimo_login?: string | null;
  ultima_atividade?: string | null;
  online?: boolean;
}

