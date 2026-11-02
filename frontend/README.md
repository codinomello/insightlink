# InsightLink — frontend

React 19 + TypeScript + Vite. Gráficos com Recharts; fontes via Fontsource (Geist e Instrument Serif).

```bash
npm install
npm run dev        # http://localhost:5173 (proxy de /api para o backend)
npm run typecheck  # checagem de tipos
npm run lint       # oxlint
npm run build      # build de produção em dist/
```

## Estrutura de `src/`

```
app/          App.tsx (login x área autenticada) e Workspace.tsx (abas por papel)
api/          cliente HTTP (fetch) e funções por domínio: auth, admin, records, dashboard
features/     uma pasta por funcionalidade
  auth/         login, perfil e sessão (AuthContext)
  dashboard/    dados compartilhados das abas (DashboardDataContext) e barra de ações
  overview/     painel: KPIs, gráficos e importação de arquivos
  analytics/    análises: heatmap, dispersão, radar, treemap...
  records/      tabela, detalhes e formulário de registros
  activity/     relatório de uploads, usuários online e logins (admin)
  users/        gestão de usuários (admin)
components/   peças reutilizáveis: ui/ (Sheet, Dialog, Menu, ícones...), charts/, layout/
context/      ToastContext
hooks/        useCountUp, useMediaQuery, useTheme
lib/          formatadores
types/        tipos por domínio
styles/       tokens (cores/tema), base, layout, componentes, features e responsivo
```

Imports usam o alias `@/` (= `src/`).
