import type { AuthUser } from './auth';

export interface UploadLogItem {
  id: string;
  user_id: string | null;
  username: string;
  nome: string;
  arquivo: string;
  formato: string;
  tamanho_bytes: number;
  registros_importados: number;
  status: 'sucesso' | 'erro';
  mensagem?: string | null;
  criado_em: string;
}


export interface LoginLogItem {
  id: string;
  user_id: string | null;
  username: string;
  nome?: string | null;
  sucesso: boolean;
  motivo?: string | null;
  ip?: string | null;
  navegador?: string | null;
  criado_em: string;
}


export interface ActivityReport {
  resumo: {
    usuarios_online: number;
    usuarios_ativos_hoje: number;
    total_usuarios: number;
    total_uploads: number;
    uploads_com_erro: number;
    registros_importados: number;
    falhas_login_7d: number;
    janela_online_min: number;
  };
  usuarios: AuthUser[];
  uploads: UploadLogItem[];
  logins: LoginLogItem[];
  series: {
    uploads: { dia: string; uploads: number; registros: number }[];
    logins: { dia: string; usuarios: number }[];
  };
  uploads_por_usuario: { nome: string; uploads: number; registros: number }[];
}
