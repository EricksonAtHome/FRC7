# FRC Real Stack (Realistic Architecture) 🧱🚀

This directory contains the grounded, functional implementation of the **Fast Response Connection Runtime (FRC)**. It demonstrates the actual software architecture that bridges the theoretical concepts into a working Node.js ecosystem.

## 🏗️ Architecture Stack
1. **API Server (`/server/index.js`)**: An Express.js REST API simulating `frc.systems` endpoints.
2. **Execution Worker (`/worker/engine.js`)**: The core engine that processes parsed FRCL data and streams it to the API.
3. **FRCL Parser (`/frcl/parser.js`)**: A functional JavaScript parser that translates `.frcl` files into JSON instruction objects.
4. **Developer CLI (`/cli/frc.js`)**: The command-line tool developers use to execute `.frcl` files locally.
5. **JavaScript SDK (`/sdk/index.js`)**: A programmable SDK wrapper for integrating FRC directly into React/Next.js codebases.
6. **Docker Deploy (`/docker/Dockerfile`)**: A production-ready Node.js container image.

## 🚀 How to Run the Stack

### 1. Start the API Server
In one terminal, boot the FRC Systems local server:
```bash
npm install
node server/index.js
```

### 2. Execute an FRCL Script
In another terminal, use the CLI tool to execute a script:
```bash
./cli/frc.js run app.frcl
```

### Example FRCL Script (`app.frcl`)
```frcl
use model models5
run models5 {
  input "hello realistic FRC architecture"
}
```

### Example Output
```json
{
  "model": "models5",
  "output": "AI Processed: hello realistic FRC architecture",
  "node": "local-dev-node",
  "latency": "12ms"
}
```

---
*This stack represents the actual engineering foundation required to build the FRC DevOS.*
