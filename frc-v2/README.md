# 🚀 FRC v2 Production

Distributed AI execution platform.

---

## ⚙️ Start system

```bash
cd docker
docker-compose up --build
```

## 💻 Run CLI

```bash
node cli/frc.js example.frcl
```

## 🔐 API usage

```http
POST /run/models5
Headers: x-api-key: frc_test_key
```

## 🧠 System design

- **API Gateway**: Handles authentication (`x-api-key`) and queues jobs.
- **Redis Job Queue**: The central nervous system for distributed tasks.
- **Worker Cluster**: Scalable Docker nodes that pull from Redis and execute models.
- **SDK + CLI**: Developer tools to easily connect to the secure gateway.

---

*This is a fully realized distributed backend system.*
