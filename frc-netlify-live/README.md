# 🚀 FRC Netlify Live System
[![Netlify Status](https://api.netlify.com/api/v1/badges/d6402a4e-7305-4f49-bd1c-c41798ee15da/deploy-status)](https://app.netlify.com/projects/frc7/deploys)

Global AI request router with EU / US / Asia execution nodes.

---

## ⚙️ Deploy on Netlify

1. Push to GitHub
2. Connect repo to Netlify
3. Build settings:
   - Publish: public
   - Functions: functions

---

## 🌐 System flow

User → Netlify UI → Function Router → Node (EU/US/ASIA) → AI result → UI

---

## 📡 Nodes required

- eu-1.node.frc.systems
- us-1.node.frc.systems
- asia-1.node.frc.systems
