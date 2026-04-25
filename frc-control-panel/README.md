# FRC Netlify Control App 🚀

A lightweight, serverless dashboard that acts as the "Global Router" for the Fast Response Connection (FRC) ecosystem. 

## 🧠 Architecture
1. **Frontend (`/public/index.html`)**: A clean, premium dashboard for writing FRCL requests.
2. **Smart Gateway (`/functions/route.js`)**: A Netlify serverless function that detects the user's geographical location via request headers (`x-country`) and dynamically routes the execution to the nearest FRC node (`eu-1`, `us-1`, `asia-1`).
3. **Execution Nodes (External)**: The actual heavy lifting is done on dedicated FRC servers. Netlify simply acts as the traffic controller.

## ⚙️ How to run locally
Because this relies on Netlify Functions, you need the Netlify CLI.

```bash
npm install
npm start
```
This will start `netlify dev` on `http://localhost:8888`.

## 🌐 How it works
1. You write FRCL code in the left panel.
2. Click "Deploy Request".
3. The browser calls `/.netlify/functions/route`.
4. The function checks your region and forwards the payload to `eu-1.node.frc.systems` (or US/Asia).
5. The JSON response from the FRC Node is displayed in the right panel.
