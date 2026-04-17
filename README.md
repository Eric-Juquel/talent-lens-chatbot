# TalentLens

AI-powered candidate profile analyzer for recruiters and HR teams. Upload a CV, cover letter, and LinkedIn PDF to get a structured summary, detected links, and an AI chatbot ready to answer questions about the candidate.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Monorepo | pnpm workspaces | 10.x |
| Backend | NestJS + TypeScript | 11.x / 5.x |
| Frontend | React + Vite + TypeScript | 19.x / 8.x / 5.x |
| Styling | Tailwind v4 + shadcn/ui | 4.x |
| AI | OpenAI SDK — `gpt-4o-mini` or Ollama | 6.x |
| PDF parsing | pdf-parse | 2.x |
| Validation | Zod + nestjs-zod | 4.x / 5.x |
| HTTP client | Axios + Orval | 1.x / 8.x |
| State | Zustand | 5.x |
| i18n | react-i18next | 17.x |
| Testing | Vitest + MSW | 4.x / 2.x |

## Features

- Upload CV, cover letter, and LinkedIn PDF (PDF, Word, TXT)
- AI-generated structured summary (name, title, skills by category, recruiter insight)
- Detected links (GitHub, LinkedIn, portfolio)
- AI chatbot to interrogate the candidate profile
- FR / EN interface — AI content generated in the active language
- Supports OpenAI (`gpt-4o-mini`) or a local Ollama model

## Prerequisites

- Node.js 20+
- pnpm 10+
- An OpenAI API key (or a local Ollama instance)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure the API
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env and set OPENAI_API_KEY=sk-...

# 3. Start everything
pnpm dev
```

## URLs

| Service | URL |
|---|---|
| **Frontend** | http://localhost:5173 |
| **REST API** | http://localhost:3001 |
| **Swagger UI** | http://localhost:3001/docs |
| **OpenAPI JSON** | http://localhost:3001/docs-json |

## Available scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start API + frontend in parallel (watch mode) |
| `pnpm build` | Production build (API then frontend) |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run all tests (watch mode) |
| `pnpm generate:api` | Export OpenAPI spec then regenerate Orval client |

### Frontend test scripts (`packages/web`)

| Script | Description |
|---|---|
| `pnpm --filter ./packages/web test` | Run frontend tests in watch mode |
| `pnpm --filter ./packages/web test:run` | Run frontend tests once (CI) |
| `pnpm --filter ./packages/web test:coverage` | Run tests and generate coverage report (target ≥ 80%) |

## Project structure

```
talent-lens/
├── packages/
│   ├── api/          # NestJS 11 backend (upload, chat, summary)
│   └── web/          # React 19 Vite frontend
├── biome.json        # Shared Biome config
└── pnpm-workspace.yaml
```

## Environment variables

**`packages/api/.env`**

```
OPENAI_API_KEY=sk-...          # required for OpenAI
OPENAI_BASE_URL=               # optional: set to Ollama URL (e.g. http://localhost:11434/v1)
OPENAI_MODEL=gpt-4o-mini       # optional: override model name
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:5173
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

**`packages/web/.env`** (already created)

```
VITE_API_BASE_URL=http://localhost:3001
```
