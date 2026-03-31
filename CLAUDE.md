# TalentLens — CLAUDE.md

## Project overview

Outil pour recruteurs/RH permettant d'analyser un profil candidat à partir de ses documents (CV, lettre de motivation, LinkedIn PDF). Extraction de texte PDF, détection de liens personnels, chatbot IA, synthèse structurée avec tableau de compétences.

## Stack

| Couche | Techno |
|---|---|
| Monorepo | pnpm workspaces |
| Backend | NestJS 11 + TypeScript (`packages/api`) |
| Frontend | React 19 + Vite + TypeScript (`packages/web`) |
| Client HTTP | Orval v8 (généré depuis Swagger NestJS) |
| Styles | Tailwind v4 + shadcn/ui — thème Dark Premium (indigo/violet) |
| IA | OpenAI SDK — `gpt-4o-mini` |
| PDF parsing | `pdf-parse` (NestJS, côté serveur uniquement) |
| i18n | `react-i18next` — FR/EN |
| Routing | React Router v7 |
| Linting | Biome 2.4.10 (root only, sub-packages extend `../biome.json`) |

## Key commands

```bash
pnpm dev              # démarre api (:3001) + web (:5173) en parallèle
pnpm build            # build api puis web
pnpm lint             # lint tous les packages
pnpm generate:api     # exporte OpenAPI puis génère le client Orval
pnpm --filter ./packages/api run dev:package   # backend seul
pnpm --filter ./packages/web run dev:package   # frontend seul
```

## Architecture

```
packages/
├── api/   # NestJS — modules: upload, chat, summary
└── web/   # React 19 — pages: Home (wizard), Summary
```

### Backend endpoints
- `POST /upload` — reçoit 3 PDFs (multer memoryStorage), extrait texte (pdf-parse), détecte liens
- `POST /chat` — message + historique + contexte → OpenAI GPT-4o-mini avec tools
- `POST /summary` — contexte → résumé structuré JSON (skills catégorisés, synthèse IA)

### Frontend pages
- `/` — Wizard 3 étapes : Upload → Analyse → Chat
- `/summary` — Résumé candidat avec skills par catégorie + synthèse IA

## OpenAI tools (comme app.py de référence)
- `record_unknown_question` — log les questions sans réponse
- `record_user_details` — si le recruteur laisse son email

## Important conventions
- **Pas de base de données** — session unique, état en mémoire locale uniquement
- **PDF parsing côté serveur uniquement** — jamais côté client
- **Clé OpenAI** dans `packages/api/.env` (OPENAI_API_KEY) — ne jamais committer
- **Biome** installé uniquement à la racine — les sub-packages utilisent `extends: ["../biome.json"]`
- **NestJS DI** — garder les imports de classes en `import` (pas `import type`) pour que l'injection fonctionne

## Orval pattern (mode: tags + axios mutator)

```typescript
// Les fonctions générées sont des factories — toujours instancier avant d'utiliser
import { getUploadApi } from "@/api/services/generated/upload";
const client = getUploadApi();
await client.uploadFiles(formData);
```

## Design system
- Dark mode par défaut, toggle light
- Primary: indigo-500 (`#6366f1`) / accent: violet-500 (`#8b5cf6`)
- Background: `#0f0f13` / surface: `#1a1a2e`
- Font: Inter
