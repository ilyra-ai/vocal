# 🎤 VocalCoach AI

> **Seu coach vocal pessoal com inteligência artificial de nível PhD — direto no navegador.**

[![Made with React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![OpenAI GPT-5](https://img.shields.io/badge/OpenAI-GPT--5-412991?style=flat-square&logo=openai)](https://openai.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql)](https://postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

---

## ✨ O que é o VocalCoach AI?

O **VocalCoach AI** é uma aplicação web full-stack que usa o microfone do seu navegador para **gravar sua voz**, analisa o áudio em tempo real com a **Web Audio API** e fornece um feedback vocal personalizado e detalhado através da **Dra. Elena Voce** — uma IA treinada com o rigor acadêmico de um doutorado em pedagogia vocal pela Juilliard School.

Nada de placeholders. Nada de mockups. **100% real.**

---

## 🚀 Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 🎙️ **Gravação no Navegador** | Captura de voz via microfone com Web Audio API |
| 📊 **Análise de Pitch em Tempo Real** | Detecção de frequência e nota musical ao vivo |
| 🤖 **Feedback por IA (GPT-5)** | Análise profunda de tom, entonação, respiração, vibrato e ritmo |
| 💬 **Chat com a Dra. Elena Voce** | Converse com sua coach em tempo real via streaming SSE |
| 📁 **Histórico de Sessões** | Salve e revise todas as suas gravações e evoluções |
| 👤 **Perfil Vocal Personalizado** | Acompanhe sua tendência de progresso e pontos fortes |
| 🌙 **Tema Dark Purple/Blue** | Interface elegante e imersiva |
| 🇧🇷 **100% em Português (pt-BR)** | Interface completamente em português brasileiro |

---

## 🎓 A Dra. Elena Voce

A coach IA foi projetada com prompts de nível especialista cobrindo:

- 🫁 **Fisiologia vocal** — mecânica laríngea, tipos de fonação
- 🔊 **Física acústica** — rastreamento de formantes, análise espectral
- 💨 **Gestão de ar** — técnica de appoggio, pressão subglótica
- 🎵 **Transições de registro** — passaggio, técnica de cobertura
- 🎭 **Estilos vocais** — ópera, pop, jazz, rock, R&B, MPB, sertanejo
- 🌀 **Vibrato e saúde vocal**

---

## 🏗️ Arquitetura

```
vocal/
├── 🌐 artifacts/
│   ├── vocal-coach/        # Frontend React + Vite (Tailwind, Framer Motion)
│   └── api-server/         # Backend Express 5 (Node.js 24)
├── 📦 lib/
│   ├── db/                 # Drizzle ORM + PostgreSQL
│   ├── api-spec/           # OpenAPI Spec + Orval Codegen
│   ├── api-client-react/   # React Query hooks (gerados)
│   └── integrations-openai-ai-server/  # Cliente OpenAI via Replit AI
├── pnpm-workspace.yaml
└── tsconfig.json
```

### Stack Tecnológica

**Frontend**
- ⚛️ React 19 + Vite
- 🎨 Tailwind CSS v4
- 🎞️ Framer Motion
- 🔗 TanStack Query (React Query)
- 📍 Wouter (roteamento)

**Backend**
- 🟢 Node.js 24 + Express 5
- 🗄️ PostgreSQL + Drizzle ORM
- 🤖 OpenAI GPT-5 (via Replit AI Integrations)
- 📡 SSE (Server-Sent Events) para streaming

**Tooling**
- 📦 pnpm workspaces (monorepo)
- 🔷 TypeScript 5.9 (strict mode)
- 🛠️ esbuild + Vite

---

## 🗃️ Schema do Banco de Dados

```sql
vocal_sessions     -- Sessões de prática (gênero, música, score)
vocal_recordings   -- Gravações individuais com scores de IA
vocal_profile      -- Perfil cumulativo do artista
conversations      -- Threads de chat com a Dra. Elena Voce
messages           -- Mensagens individuais do chat
```

---

## ⚙️ Como Rodar Localmente

### Pré-requisitos

- Node.js 24+
- pnpm 9+
- PostgreSQL 16+

### Instalação

```bash
# Clone o repositório
git clone https://github.com/ilyra-ai/vocal.git
cd vocal

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL e OPENAI_API_KEY (ou use Replit AI Integrations)

# Execute as migrações do banco
pnpm --filter @workspace/db run push

# Inicie o backend
pnpm --filter @workspace/api-server run dev

# Inicie o frontend (em outro terminal)
pnpm --filter @workspace/vocal-coach run dev
```

### Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão PostgreSQL |
| `OPENAI_API_KEY` | Chave da API OpenAI (ou use Replit AI Integrations) |
| `PORT` | Porta do servidor (padrão: 3000) |

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/vocal-coach/sessions` | Listar sessões |
| `POST` | `/api/vocal-coach/sessions` | Criar sessão |
| `GET` | `/api/vocal-coach/sessions/:id` | Detalhes da sessão |
| `DELETE` | `/api/vocal-coach/sessions/:id` | Deletar sessão |
| `POST` | `/api/vocal-coach/sessions/:id/analyze` | **Análise por IA (SSE)** |
| `GET` | `/api/vocal-coach/profile` | Perfil vocal |
| `PUT` | `/api/vocal-coach/profile` | Atualizar perfil |
| `GET` | `/api/openai/conversations` | Listar conversas |
| `POST` | `/api/openai/conversations` | Nova conversa |
| `POST` | `/api/openai/conversations/:id/messages` | **Chat com IA (SSE)** |

---

## 🖥️ Capturas de Tela

### 🏠 Painel Principal
Interface elegante com cards de estatísticas e sessões recentes.

### 🎙️ Estúdio de Gravação
Visualizador de áudio em tempo real com detecção de nota e pitch ao vivo.

### 📊 Análise da IA (streaming)
Feedback detalhado da Dra. Elena Voce transmitido em tempo real.

### 💬 Chat com a Coach
Conversa fluida via SSE com a IA vocal especialista.

---

## 🔊 Como Funciona a Análise Vocal

```
1. 🎙️  Usuário grava → Web Audio API captura PCM
        ↓
2. 📈  AnalyserNode detecta frequências por FFT
        ↓
3. 🎼  Algoritmo YIN converte Hz → nota musical
        ↓
4. 📦  Payload {pitch[], duration, blob} enviado ao backend
        ↓
5. 🤖  GPT-5 analisa com prompt de nível PhD
        ↓
6. 📡  Feedback streamado via SSE em tempo real
        ↓
7. 💾  Scores e análise salvos no PostgreSQL
```

---

## 🤝 Contribuindo

Contribuições são muito bem-vindas! 🎉

```bash
# Fork o repositório
# Crie uma branch para sua feature
git checkout -b feat/minha-feature

# Commit suas mudanças
git commit -m "feat: adiciona minha feature"

# Push para o seu fork
git push origin feat/minha-feature

# Abra um Pull Request
```

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** — veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 💜 Feito com amor por [ilyra-ai](https://github.com/ilyra-ai)

> *"A voz é o instrumento mais pessoal que existe. Com IA, podemos aperfeiçoá-la como nunca antes."*
> — **Dra. Elena Voce**, Coach Vocal IA

---

<div align="center">

**⭐ Se este projeto te ajudou, deixe uma estrela no GitHub! ⭐**

</div>
