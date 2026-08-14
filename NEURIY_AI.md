# Neuriy AI on FRC7

**Neuriy AI** adds ChatGPT-style conversational models to FRC7, inspired by the [Neuriy Marketplace](https://github.com/neuriy/Neuriy-Marketplace) app-store product (Assistants, Creative, Developer, …).

> Important: Neuriy’s **local engine** is an application-layer chat system (sessions, RAG, tools, personas). It is **not** a secretly trained multi-billion-parameter transformer. Point `NEURIY_LLM_*` at any OpenAI-compatible API for full neural generation.

## Models

| Model | Role |
|---|---|
| `neuriy.chat` | General conversation |
| `neuriy.assistant` | Task-oriented helper |
| `neuriy.reason` | Step-by-step reasoning style |
| `neuriy.code` | Pair-programming |
| `neuriy.creative` | Writing / ideation |
| `neuriy.tutor` | Teaching companion |
| `neuriy.translate` | EN / FR / HT glossary assist |
| `neuriy.marketplace` | Search Neuriy Marketplace apps |

## Quick start

```bash
npm install
npm run demo:neuriy
npx frc chat neuriy.chat "What is an LLM?"
npx frc run examples/neuriy/chat.frcl
```

```bash
curl -s localhost:3000/v1/chat \
  -H 'content-type: application/json' \
  -H 'x-api-key: ayiti_gov_test_key' \
  -d '{"model":"neuriy.chat","message":"Hello Neuriy"}'
```

OpenAI-compatible shape:

```bash
curl -s localhost:3000/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'x-api-key: ayiti_gov_test_key' \
  -d '{"model":"neuriy.code","messages":[{"role":"user","content":"Hello"}]}'
```

## Architecture (product layer)

```
User
  ↓
FRC7 UI / CLI / Control Panel
  ↓
Gateway  /v1/chat  ·  /v1/chat/completions  ·  /v1/run/neuriy.*
  ↓
Orchestration  (safety → session → RAG → tools → generate → safety)
  ↓
Local Neuriy engine  OR  remote OpenAI-compatible LLM
  ↓
Tools: time · calculator · marketplace · memory
  ↓
Response + session history
```

This mirrors the **public conceptual** ChatGPT stack (UI + orchestration + model + tools), not OpenAI’s private internals. See [docs/chatgpt-systems.md](docs/chatgpt-systems.md).

## Optional remote LLM

```bash
export NEURIY_LLM_BASE_URL=https://api.openai.com/v1
export NEURIY_LLM_API_KEY=sk-...
export NEURIY_LLM_MODEL=gpt-4o-mini
```

## Marketplace bridge

Neuriy Marketplace (ASP.NET + FastAPI) is an **app store**. FRC7’s `neuriy.marketplace` model and `GET /v1/neuriy/marketplace` search that API when available (`NEURIY_MARKETPLACE_URL`), otherwise a local assistant catalog.

Clone reference: `https://github.com/neuriy/Neuriy-Marketplace.git`

## Package

`packages/neuriy` (`@neuriy/ai`) — tokenizer (educational), sessions, RAG, tools, safety, orchestrator, marketplace client.
