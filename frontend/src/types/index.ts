export interface Project {
  id: string | number;
  titulo: string;
  tipo: string;
  proponente?: string;
  email?: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  mentor?: string;
  origem_arquivo?: string;
  completude?: number;
  objetivo?: string;
  contexto_limitacoes?: string;
  requisitos_tecnicos?: string;
  restricoes?: string;
  entregaveis_sucesso?: string;
}

export interface SummaryItem {
  nome: string;
  quantidade: number;
}

export interface DashboardSummary {
  total: number;
  desafios: number;
  projetos: number;
  empresas: number;
  proponentes: number;
  completude_media: number;
  palavras_media: number;
  por_empresa: SummaryItem[];
  por_cargo: SummaryItem[];
  por_tipo: SummaryItem[];
}

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

export interface CrosstabEmpresaCargo {
  empresas: string[];
  cargos: string[];
  matriz: { empresa: string; cargo: string; quantidade: number }[];
}

export interface CorrelacaoPalavrasCompletude {
  coeficiente: number;
  pontos: { titulo: string; empresa?: string; tipo?: string; palavras: number; completude: number }[];
}

export interface CompletudePorTipo {
  tipo: string;
  media: number;
  minimo: number;
  maximo: number;
  quantidade: number;
}

export interface RadarPorEmpresa {
  empresas: string[];
  eixos: string[];
  dados: Record<string, string | number>[];
}

export interface TreemapItem {
  name: string;
  size: number;
  [key: string]: string | number;
}

export interface AnalyticsData {
  crosstab_empresa_cargo: CrosstabEmpresaCargo;
  crosstab_empresa_tipo: Record<string, string | number>[];
  correlacao_palavras_completude: CorrelacaoPalavrasCompletude;
  completude_por_tipo: CompletudePorTipo[];
  radar_por_empresa: RadarPorEmpresa;
  treemap_empresas: TreemapItem[];
}
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
