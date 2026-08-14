# FRC7 — Fast Response Connection

[![CI](https://github.com/EricksonAtHome/FRC7/actions/workflows/ci.yml/badge.svg)](https://github.com/EricksonAtHome/FRC7/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6402a4e-7305-4f49-bd1c-c41798ee15da/deploy-status)](https://app.netlify.com/projects/frc7/deploys)

**FRC7** is a distributed AI execution platform with a declarative language (**FRCL**), a production gateway, **Ayiti OS (GoV)** Haitian government models, and **Neuriy AI** ChatGPT-style conversational models.

![FRC](https://raw.githubusercontent.com/EricksonAtHome/FRC7/refs/heads/main/img/1n8jky1n8jky1n8j.png)

## What's new in 7.2

- **Neuriy AI chat models** — `neuriy.chat`, `neuriy.assistant`, `neuriy.reason`, `neuriy.code`, `neuriy.creative`, `neuriy.tutor`, `neuriy.translate`, `neuriy.marketplace`
- **Chat APIs** — `/v1/chat`, `/v1/chat/completions` (OpenAI-compatible shape), sessions, marketplace search
- **Tools + RAG + safety** orchestration (local engine; optional remote LLM via `NEURIY_LLM_*`)
- **Docs** — [NEURIY_AI.md](NEURIY_AI.md), [docs/chatgpt-systems.md](docs/chatgpt-systems.md) (full GPT/ChatGPT technical guide)
- Marketplace bridge to [Neuriy Marketplace](https://github.com/neuriy/Neuriy-Marketplace)

## What's in 7.1

- **Ayiti OS GoV models** (`ayiti.search`, `ayiti.stats`, `ayiti.dgi`, …)
- **Live HaitiDocs MCP + JSON APIs** (search, indicators, documents)
- **Ministry portals** — MEF, DGI, BRH, OMRH, CNMP (+ AyitiStats)
- **APIs**: `/v1/batch`, `/v1/lint`, `/v1/metrics`, `/v1/worker/tick`, webhooks
- **FRCL upgrades**: `lang`, `webhook`, `retry`, `batch`, comments, URL idents
- **Control panel** UI · **Tests + CI** on Node 20/22

## Quick start

```bash
npm install
npm test
npm run demo                 # ayiti.translate local demo
npm run demo:ayiti           # live HaitiDocs search
npm run demo:neuriy          # Neuriy chat demo
npm run start:gateway        # http://127.0.0.1:3000
npm start -w @frc/control-panel   # http://127.0.0.1:8787
```

```bash
# CLI
npx frc models
npx frc chat "Hello Neuriy"
npx frc chat neuriy.code "Write a hello world"
npx frc exec ayiti.citizen "Mwen bezwen NIF nan DGI"
npx frc lint demo.frcl
npx frc health
npx frc run examples/neuriy/chat.frcl
npx frc run examples/ayiti/search.frcl
```

## Architecture

```
Client / CLI / Control Panel / Arduino
              │
              ▼
     FRC7 Gateway  — auth · chat · lint · batch · geo-route
              │
     Redis queue + job results + webhooks
              │
       ┌──────┴──────┐
       ▼             ▼
  Neuriy AI      Ayiti OS GoV
  (chat/tools)   (HaitiDocs / portals)
```

## Neuriy AI models

| Model | Purpose |
|---|---|
| `neuriy.chat` | General ChatGPT-style conversation |
| `neuriy.assistant` | Task helper with tools |
| `neuriy.reason` | Step-by-step reasoning style |
| `neuriy.code` | Pair programming |
| `neuriy.creative` | Writing / ideation |
| `neuriy.tutor` | Teaching |
| `neuriy.translate` | EN / FR / HT assist |
| `neuriy.marketplace` | Search Neuriy Marketplace apps |

See [NEURIY_AI.md](NEURIY_AI.md) and the deep dive [docs/chatgpt-systems.md](docs/chatgpt-systems.md).

## Ayiti OS (GoV) models

| Model | Purpose |
|---|---|
| `ayiti.search` | HaitiDocs knowledge search |
| `ayiti.stats` | Indicator catalog / SDMX series |
| `ayiti.docs` | Official document lookup |
| `ayiti.mef` / `ayiti.dgi` / `ayiti.brh` / `ayiti.omrh` / `ayiti.cnmp` | Ministry desks |
| `ayiti.citizen` | Intent triage → ministry model |
| `ayiti.translate` | Kreyòl / FR / EN civic glossary assist |
| `ayiti.alert` | Public alert brief from open sources |
| `ayiti.uxp` | Inter-agency exchange envelope |

Generic models like `models5` are **rejected** unless `FRC_ALLOW_BUILTIN=1` (demo only: `echo`, `summarizer`, `coder`).

## HTTP API

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Liveness + Ayiti + Neuriy |
| `GET` | `/v1/models` | Neuriy + Ayiti models |
| `POST` | `/v1/chat` | Neuriy conversational chat |
| `POST` | `/v1/chat/completions` | OpenAI-compatible chat |
| `POST` | `/v1/neuriy/sessions` | Create chat session |
| `GET` | `/v1/neuriy/marketplace` | Marketplace search |
| `GET` | `/v1/metrics` | Queue counters |
| `POST` | `/v1/run/:model` | Sync/async model run |
| `POST` | `/v1/execute` | Full FRCL script |
| `POST` | `/v1/batch` | Up to 20 jobs |
| `POST` | `/v1/lint` | FRCL validation |
| `GET` | `/v1/jobs/:id` | Job status/result |
| `POST` | `/v1/worker/tick` | Process one queued job |

Auth: `x-api-key: ayiti_gov_test_key` (dev).

```bash
curl -s localhost:3000/v1/run/ayiti.search \
  -H 'content-type: application/json' \
  -H 'x-api-key: ayiti_gov_test_key' \
  -d '{"input":"BRH inflation","sync":true,"region":"ht"}'
```

## FRCL example

```frcl
set env "prod"
region ht
lang ht

use model "ayiti.citizen"

run model ayiti.citizen {
  input "Mwen bezwen NIF nan DGI"
  retry 1
}

print result
```

## Monorepo layout

| Path | Role |
|---|---|
| `packages/frcl` | Language tokenizer / parser / lint |
| `packages/engine` | Execution + model policy |
| `packages/core` | Auth, regions, Redis/memory queue, webhooks, metrics |
| `packages/ayiti-gov` | Government models + Haiti API clients |
| `packages/sdk` | JS client |
| `apps/gateway` | Production API |
| `apps/cli` | `frc` CLI |
| `apps/control-panel` | Browser UI |
| `examples/` | Sample `.frcl` scripts |
| `frc-v1` … `frc-k8s` | Legacy infra packages (reference) |

## Configuration

Copy `.env.example` → `.env`:

- `AYITI_API_KEY` / `FRC_API_KEYS`
- `REDIS_URL` (optional — memory fallback)
- `AYITI_HAITIDOCS_MCP` / portal URL overrides
- `FRC_ALLOW_BUILTIN=1` for local non-gov demos

## License

MIT
