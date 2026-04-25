# 🚀 FRC Kubernetes Production ☸️

This is the enterprise-grade, cloud-native deployment of the Fast Response Connection (FRC) platform. It utilizes Kubernetes to provide high availability, zero-downtime deployments, auto-scaling, and intelligent global routing.

## 🏗️ Architecture

- **Ingress (`k8s/ingress.yaml`)**: Entry point for `frc.systems` routing HTTP traffic into the cluster.
- **Gateway (`gateway/`)**: Node.js service acting as the central router (`gateway-service`). It reads geographic headers and redirects traffic to the nearest internal service.
- **Regional Worker Nodes (`eu-node`, `us-node`, `asia-node`)**: The actual compute pods running the AI Engine.
- **Auto-Scaling (HPA)**: Pods automatically scale from 2 to 10 replicas if CPU utilization exceeds 70%.

## 🚀 Deployment Instructions

### 1. Build and Push Docker Images
```bash
docker build -t frc/gateway ./gateway
docker build -t frc/eu-node ./eu-node
docker build -t frc/us-node ./us-node
docker build -t frc/asia-node ./asia-node

docker push frc/gateway
docker push frc/eu-node
docker push frc/us-node
docker push frc/asia-node
```

### 2. Apply Kubernetes Configs
```bash
kubectl apply -f gateway/
kubectl apply -f eu-node/
kubectl apply -f us-node/
kubectl apply -f asia-node/
kubectl apply -f k8s/
```

### 3. Monitor Cluster
```bash
kubectl get pods
kubectl get svc
kubectl get hpa
```
