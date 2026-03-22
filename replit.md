# VocalCoach AI

## Overview

A professional PhD-level AI singing coaching application. Records the user's voice via the browser microphone, performs real-time audio analysis using Web Audio API, and sends the audio data to a GPT-5.2 AI acting as Dr. Elena Voce — a doctoral-level vocal pedagogy expert — who provides personalized, expert-level feedback on pitch accuracy, intonation, breath support, vibrato, and timing.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/vocal-coach)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Replit AI Integrations → OpenAI gpt-5.2
- **Validation**: Zod, drizzle-zod
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express 5 API server
│   └── vocal-coach/        # React + Vite frontend (at "/" preview path)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # OpenAI server-side client
│   └── integrations-openai-ai-react/   # OpenAI React hooks
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

- `vocal_sessions` — Practice sessions with genre, target song, skill level, overall score
- `vocal_recordings` — Individual recordings with pitch analysis scores (accuracy, intonation, breath, vibrato, timing)
- `vocal_profile` — User's cumulative profile (strengths, areas to improve, progress trend)
- `conversations` — AI coach chat conversation threads
- `messages` — Individual chat messages

## API Routes

- `GET/POST /api/vocal-coach/sessions` — List/create sessions
- `GET/DELETE /api/vocal-coach/sessions/:id` — Get/delete session with recordings
- `POST /api/vocal-coach/sessions/:id/analyze` — Submit audio for AI analysis (SSE stream)
- `GET /api/vocal-coach/sessions/:id/recordings` — List recordings
- `GET/PUT /api/vocal-coach/profile` — Vocal profile management
- `GET/POST /api/openai/conversations` — Conversation management
- `POST /api/openai/conversations/:id/messages` — AI chat (SSE stream)

## AI Analysis

The AI coach `Dr. Elena Voce` is prompted as a Juilliard PhD with expertise in:
- Vocal physiology (laryngeal mechanics, phonation types)
- Acoustic physics (formant tracking, spectral analysis)
- Breath management (appoggio technique, sub-glottal pressure)
- Register transitions (passaggio, cover technique)
- Style-specific technique (opera, pop, jazz, rock, R&B, etc.)
- Vibrato mechanics and vocal health

Analysis output includes:
- Executive Summary
- Pitch & Intonation Assessment
- Breath Management & Phonation
- Resonance & Tone Quality
- Technical Issues (numbered)
- Personalized Exercise Protocol (with specific pitches/durations)
- Prognosis & Next Session Focus

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (composite: true). Root `tsconfig.json` lists all libs as project references.

- Always typecheck from root: `pnpm run typecheck`
- After spec changes: `pnpm --filter @workspace/api-spec run codegen`
- DB migrations: `pnpm --filter @workspace/db run push`

## Key Notes

- Audio payloads: Express body limit is 50MB
- Pitch analysis: Client-side Web Audio API (AnalyserNode) sends pitch time-series to backend
- SSE streaming: Both analysis and chat use SSE (not EventSource - uses fetch + ReadableStream)
- AI integration: Replit AI Integrations proxy (no API key needed, billed to Replit credits)
