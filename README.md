# FRC7 — Fast Response Connection

[![CI](https://github.com/EricksonAtHome/FRC7/actions/workflows/ci.yml/badge.svg)](https://github.com/EricksonAtHome/FRC7/actions/workflows/ci.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6402a4e-7305-4f49-bd1c-c41798ee15da/deploy-status)](https://app.netlify.com/projects/frc7/deploys)

**FRC7** is a distributed AI execution platform with a declarative language (**FRCL**), a production gateway, and **Ayiti OS (GoV)** — Haitian government models wired to real public APIs.

![FRC](https://raw.githubusercontent.com/EricksonAtHome/FRC7/refs/heads/main/img/1n8jky1n8jky1n8j.png)

## What's new in 7.1

- **Ayiti OS GoV models only by default** (`ayiti.search`, `ayiti.stats`, `ayiti.dgi`, …)
- **Live HaitiDocs MCP + JSON APIs** (search, indicators, documents)
- **Ministry portals** — MEF, DGI, BRH, OMRH, CNMP (+ AyitiStats)
- **New APIs**: `/v1/batch`, `/v1/lint`, `/v1/metrics`, `/v1/worker/tick`, webhooks
- **New models**: `ayiti.translate`, `ayiti.alert`, citizen triage, UXP envelopes
- **FRCL upgrades**: `lang`, `webhook`, `retry`, `batch`, comments, URL idents
- **Control panel** UI for Ayiti OS
- **Tests + CI** on Node 20/22

## Quick start

```bash
npm install
npm test
npm run demo                 # ayiti.translate local demo
npm run demo:ayiti           # live HaitiDocs search
npm run start:gateway        # http://127.0.0.1:3000
npm start -w @frc/control-panel   # http://127.0.0.1:8787
```

```bash
# CLI
npx frc models
npx frc exec ayiti.citizen "Mwen bezwen NIF nan DGI"
npx frc lint demo.frcl
npx frc health
npx frc run examples/ayiti/search.frcl
```

## Architecture

```
Client / CLI / Control Panel / Arduino
              │
              ▼
     FRC7 Gateway  — auth · lint · batch · geo-route (HT default)
              │
     Redis queue + job results + webhooks
              │
              ▼
     @frc/engine  →  Ayiti OS GoV models
              │
              ▼
 HaitiDocs MCP/JSON · AyitiStats · .gouv.ht portals
```

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
| `GET` | `/health` | Liveness + Ayiti probe summary |
| `GET` | `/v1/models` | Allowed GoV models |
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
