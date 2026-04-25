# 🚀 FRC v1

Fast Response Connection (FRC) is a lightweight AI execution runtime.

---

## ⚙️ Start server

```bash
npm install
npm start
```

## 💻 Run CLI

```bash
node cli/frc.js example.frcl
```

## 🤖 Run SDK

```javascript
import { FRC } from "./sdk/index.js";

const frc = new FRC("http://localhost:3000");

const res = await frc.run("models5", "hello world");
console.log(res);
```

## 🐳 Docker

```bash
docker build -t frc .
docker run -p 3000:3000 frc
```
