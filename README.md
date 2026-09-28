
# 📊 InsightLink

### Dashboard inteligente para os desafios e projetos da plataforma **ENIAC Link+**

Importe PDFs e planilhas, visualize indicadores em tempo real e gerencie tudo com controle de acesso por papel.

---

## 📑 Sumário

* [Visão geral](#-visão-geral)
* [Funcionalidades](#-funcionalidades)
* [Papéis de usuário](#-papéis-de-usuário)
* [Arquitetura do projeto](#-arquitetura-do-projeto)
* [Stack utilizada](#-stack-utilizada)
* [Como executar](#-como-executar)
  * [Opção A — Docker Compose](#opção-a--docker-compose-recomendado)
  * [Opção B — Manual](#opção-b--manual-backend--frontend-separados)
* [Primeiro acesso](#-primeiro-acesso)
* [Build para produção](#-build-para-produção)
* [Referência da API](#-referência-da-api)
* [Licença](#-licença)

---

## 🔎 Visão geral

O **InsightLink** recebe os arquivos exportados pela plataforma **ENIAC Link+**

(PDF dos templates *"Proposta de Desafio"* / *"Proposta de Projeto"*, ou

planilhas `.xlsx` equivalentes), extrai automaticamente os dados estruturados

e apresenta tudo em um dashboard interativo — com KPIs, gráficos, cruzamentos

avançados e uma tabela de registros com busca e filtros.

> 💡 Além da importação de arquivos, administradores podem **cadastrar e
> editar registros manualmente**, direto pela interface — sem precisar de
> upload.

## ✨ Funcionalidades

<table>
<tr>

<td width="50%" valign="top">

**📥 Importação & Dados**

* Upload de PDF ou planilha `.xlsx`
* Extração automática de campos e seções
* Cadastro manual de registros (admin)
* Edição e remoção de registros (admin)

**📈 Dashboard**

* KPIs (total, desafios × projetos, empresas, proponentes, completude média)
* Gráficos por empresa, cargo e tipo (Recharts)
* Exportação de relatórios em **PDF** e **Excel**

</td>

<td width="50%" valign="top">

**🔬 Análises avançadas**

* Heatmap Empresa × Cargo
* Desafios × Projetos por empresa (barras empilhadas)
* Correlação Volume de Texto × Completude (scatter)
* Radar comparativo entre empresas
* Treemap de volume por empresa

**🔐 Contas & Acesso**

* Login com JWT e dois papéis (`admin` / `user`)
* Autocadastro de novos usuários
* Painel de gestão de usuários (admin)
* Área "Minha Conta" (perfil e senha)

</td>

</tr>
</table>

## 🛡️ Papéis de usuário

A plataforma exige login e distingue dois papéis:

| Papel             | Ícone | Pode fazer                                                                                                                                                                                                          |
| ----------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador** | 🛠️   | Tudo do usuário comum **+** importar arquivos, criar/editar/remover registros manualmente, limpar todos os dados e gerenciar usuários (criar, promover/rebaixar, ativar/desativar, redefinir senha, remover).       |
| **Usuário comum** | 👤    | Visualizar dashboard, gráficos, análises avançadas e tabela de registros; baixar relatórios (PDF/XLSX); editar o próprio perfil e senha em **"Minha Conta"**. Não pode importar, criar, editar ou apagar registros. |

Qualquer pessoa pode se autocadastrar pela tela de login, mas toda conta

nasce com o papel `user`. Somente um administrador pode promover alguém a

`admin`, pela aba **Usuários**.

## 🏗️ Arquitetura do projeto

```text
insightlink-py/

├── docker-compose.yml

├── backend/                      Flask (API REST) — modularizado
│   ├── app.py                   ponto de entrada (application factory)
│   ├── config.py                configurações via variáveis de ambiente
│   ├── extensions.py            instâncias compartilhadas (db, jwt)
│   ├── requirements.txt
│   ├── models/                  modelos de dados (SQLAlchemy)
│   │   ├── user.py
│   │   └── record.py
│   ├── core/                    infraestrutura transversal
│   │   ├── database.py          criação de tabelas + seed do admin
│   │   ├── security.py          JWT + decoradores de permissão
│   │   ├── cache.py             cache em Redis
│   │   └── utils.py
│   ├── services/                regras de negócio
│   │   ├── file_parser.py       extração de PDF/planilha
│   │   ├── analytics.py         cruzamentos e correlações
│   │   └── reports.py            geração de PDF/Excel
│   └── routes/                  blueprints da API
│       ├── auth_routes.py       /api/auth/*
│       ├── admin_routes.py      /api/admin/users*
│       ├── records_routes.py    /api/upload, /api/projects*
│       └── dashboard_routes.py  /api/dashboard/*, /api/reports/*

└── frontend/                    React + Vite + TypeScript
    ├── vite.config.ts
    └── src/
        ├── main.tsx / App.tsx   bootstrap e roteamento simples
        ├── types/               tipos compartilhados
        ├── lib/api.ts           cliente HTTP (axios) + endpoints
        ├── context/AuthContext.tsx sessão e permissões
        ├── pages/               telas completas
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── ProfilePage.tsx
        │   └── UsersAdminPage.tsx
        └── components/
            ├── layout/          header e navegação por abas
            ├── dashboard/       KPIs, gráficos e análises avançadas
            └── records/         tabela, formulário e upload
```

## 🧰 Stack

| Camada                   | Tecnologias                                                         |
| ------------------------ | ------------------------------------------------------------------- |
| **Backend**              | Python · Flask · SQLAlchemy · Flask-JWT-Extended · Redis · Gunicorn |
| **Banco de dados**       | PostgreSQL 16                                                       |
| **Extração de arquivos** | pdfplumber · pandas · openpyxl                                      |
| **Relatórios**           | ReportLab (PDF) · openpyxl (Excel)                                  |
| **Frontend**             | React 19 · TypeScript · Vite · Recharts                             |
| **Infra**                | Docker & Docker Compose                                             |

## 🚀 Como executar

### Opção A — Docker Compose (recomendado)

Sobe banco, cache, API e front juntos, já conectados entre si:

```bash
docker compose up --build
```

| Serviço    | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:5173 |
| API        | http://localhost:5000 |
| PostgreSQL | `localhost:5432`      |
| Redis      | `localhost:6379`      |

### Opção B — Manual (backend + frontend separados)

<details>

<summary><strong>1. Backend (Flask)</strong></summary>

```bash
cd backend

python3 -m venv venv

source venv/bin/activate       # Windows: venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Requer um PostgreSQL e um Redis acessíveis (locais ou remotos). Configure via

variáveis de ambiente, se necessário:

```bash
export DATABASE_URL="postgresql+psycopg2://usuario:senha@localhost:5432/insightlink"
export REDIS_URL="redis://localhost:6379/0"
export JWT_SECRET_KEY="uma-chave-longa-e-secreta"
```

A API sobe em `http://localhost:5000`.

</details>

<details>

<summary><strong>2. Frontend (React + Vite)</strong></summary>

Em outro terminal:

```bash
cd frontend

npm install

npm run dev
```

A aplicação abre em `http://localhost:5173`. O Vite já vem configurado com

proxy de `/api` para `http://localhost:5000` (ver `vite.config.ts`), então

não é preciso configurar CORS manualmente para o dev server.

> Rodando via Docker Compose? O proxy usa automaticamente o hostname interno
> `api` através da variável `VITE_API_PROXY_TARGET` definida no
> `docker-compose.yml` — nada a fazer manualmente.

</details>

## 🔑 Primeiro acesso

Na primeira inicialização, o backend cria automaticamente um administrador padrão:

```text
usuário:  admin
senha:    admin123
```

> ⚠️ **Altere essa senha assim que possível** em *"Minha Conta"*, ou defina
> `DEFAULT_ADMIN_USERNAME`, `DEFAULT_ADMIN_PASSWORD` e `DEFAULT_ADMIN_EMAIL`
> **antes** de subir o backend pela primeira vez.

Depois de logado:

1. Vá em **Dashboard** e arraste um PDF/planilha do ENIAC Link+ para importar.
2. Explore os **KPIs**, os **gráficos** e as **Análises Avançadas**.
3. Use **Registros** para buscar, filtrar, editar ou cadastrar manualmente.
4. Gerencie contas em **Usuários** (visível apenas para administradores).
5. Baixe relatórios em **PDF** ou **Excel** a qualquer momento.

## 📦 Build para produção

```bash
cd frontend

npm run build
```

Os arquivos estáticos são gerados em `frontend/dist`. Sirva-os com qualquer

servidor estático (Nginx, Vercel, etc.), apontando as chamadas `/api/*` para

o backend — ou configure-os no próprio Flask com `send_from_directory`.

Para produção, recomenda-se servir o backend com **Gunicorn** (já incluso no

`requirements.txt`):

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 📡 Referência da API

> Todas as rotas abaixo (exceto `/api/health`, `/api/auth/login` e
> `/api/auth/register`) exigem o header `Authorization: Bearer <token>`.

<details>

<summary><strong>🔐 Autenticação / área do usuário</strong></summary>

| Método | Rota                 | Papel    | Descrição                                     |
| ------ | -------------------- | -------- | --------------------------------------------- |
| `POST` | `/api/auth/register` | público  | Autocadastro (sempre cria papel `user`)       |
| `POST` | `/api/auth/login`    | público  | Login — retorna `{ token, user }`             |
| `GET`  | `/api/auth/me`       | qualquer | Dados do usuário autenticado                  |
| `PUT`  | `/api/auth/me`       | qualquer | Atualiza nome/e-mail/senha do próprio usuário |

</details>

<details>

<summary><strong>👥 Gestão de usuários (somente admin)</strong></summary>

| Método   | Rota                    | Descrição                                |
| -------- | ----------------------- | ---------------------------------------- |
| `GET`    | `/api/admin/users`      | Lista todos os usuários                  |
| `POST`   | `/api/admin/users`      | Cria um novo usuário (`admin` ou `user`) |
| `PUT`    | `/api/admin/users/<id>` | Edita nome/papel/status/senha            |
| `DELETE` | `/api/admin/users/<id>` | Remove um usuário                        |

</details>

<details>

<summary><strong>📁 Dados (desafios / projetos)</strong></summary>

| Método   | Rota                       | Papel    | Descrição                                                  |
| -------- | -------------------------- | -------- | ---------------------------------------------------------- |
| `POST`   | `/api/upload`              | admin    | Envia um arquivo PDF/XLSX (campo `file`)                   |
| `GET`    | `/api/projects`            | qualquer | Lista registros (filtros: `tipo`, `empresa`, `cargo`, `q`) |
| `POST`   | `/api/projects`            | admin    | Cria um registro manualmente                               |
| `PUT`    | `/api/projects/<id>`       | admin    | Edita um registro existente                                |
| `DELETE` | `/api/projects/<id>`       | admin    | Remove um registro                                         |
| `DELETE` | `/api/projects`            | admin    | Remove todos os registros                                  |
| `GET`    | `/api/dashboard/summary`   | qualquer | KPIs e dados agregados para os gráficos                    |
| `GET`    | `/api/dashboard/analytics` | qualquer | Cruzamentos de dados (heatmap, radar, treemap, correlação) |
| `GET`    | `/api/reports/pdf`         | qualquer | Relatório em PDF                                           |
| `GET`    | `/api/reports/xlsx`        | qualquer | Relatório em Excel                                         |

</details>

---

## 📄 Licença

Projeto de uso interno/educacional. Adapte a licença conforme a necessidade da sua organização.

---

Feito com 💙 para apoiar a gestão de desafios e projetos do **ENIAC Link+**