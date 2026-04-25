# 🌍 FRC Global SaaS Platform

A multi-tenant AI execution platform with worldwide distributed nodes, billing, API keys, and a dashboard control plane.

## 🧠 Architecture Overview
This is a comprehensive, production-grade SaaS architecture mirroring systems like OpenAI API and Vercel.

- **`apps/api/`**: The core API Gateway (`frc.systems/v1/run`). It intercepts all traffic, validates API keys, records usage, and routes the payload.
- **`apps/billing/`**: Stripe integration to manage subscriptions and metered billing.
- **`services/auth/`**: Validates JWTs and strictly formatted API keys (e.g., `frc_live_xxx`).
- **`services/router/`**: Identifies user IP geography to dynamically map traffic to `eu`, `us`, or `asia` Kubernetes clusters.
- **`services/usage/`**: An internal high-speed meter mapping request limits to specific tenant IDs.
- **`infra/kubernetes/`**: Contains the horizontal scaling logic (Deployments/HPAs) for the actual worker clusters around the world.

## 🚀 Running the API Gateway
```bash
npm install
node apps/api/index.js
```

### Making a Request
```bash
curl -X POST http://localhost:3000/v1/run \
     -H "x-api-key: frc_live_testkey" \
     -H "Content-Type: application/json" \
     -d '{"input": "Hello Global SaaS"}'
```
