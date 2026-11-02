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
