import sys
import json
import time
import random

class FRCNode:
    def health_check(self):
        # Simulate varying health
        cpu = random.randint(30, 95)
        memory = random.randint(40, 80)
        return {
            "cpu": cpu,
            "memory": memory,
            "status": "healthy" if cpu < 90 else "critical"
        }

    def auto_heal(self):
        health = self.health_check()
        if health["cpu"] > 90:
            print(f"⚠️ [Self-Healing] Critical CPU load detected ({health['cpu']}%). Auto-restarting services...")
            time.sleep(1)
            return "Node services restarted automatically. Health restored."
        return "Node health optimal. No healing required."

class FRCEvolutionEngine:
    def optimize_routing(self, traffic_data):
        print(f"🧠 [Evolution Engine] Analyzing traffic: EU Load {traffic_data['eu_load']}%, Latency {traffic_data['latency']}ms")
        if traffic_data["eu_load"] > 80:
            return "shift_to_us_cluster"
        if traffic_data["latency"] > 100:
            return "use_edge_nodes"
        return "balanced_mode"

class FRCAutoScaler:
    def scale(self, load):
        if load > 70:
            print(f"📈 [Auto-Scaler] Load high ({load}%). Spawning new node...")
            return "spawn_new_node"
        if load < 20:
            print(f"📉 [Auto-Scaler] Load low ({load}%). Shutting down idle node...")
            return "shutdown_idle_node"
        return "stable"

class FRCDynamicDeploy:
    def update_strategy(self, metrics):
        if metrics["cost"] > 80:
            print("💰 [Dynamic Deploy] Cost threshold exceeded. Switching to edge-first deployment.")
            return "edge-first"
        if metrics["latency"] > 100:
            print("⚡ [Dynamic Deploy] High latency detected. Increasing global replication factor.")
            return "increase_replication"
        return "standard"

class SelfAdaptiveNodeSystem:
    def __init__(self):
        self.node = FRCNode()
        self.evolution = FRCEvolutionEngine()
        self.scaler = FRCAutoScaler()
        self.deployer = FRCDynamicDeploy()
        self.security = {
            "mode": "adaptive-zero-trust",
            "encryption": "auto-rotating-keys",
            "threat_detection": True,
            "response": "auto-isolate-node"
        }

    def run_feedback_loop(self):
        print("🔁 [Feedback Loop] Initiating Level 7 Continuous Evolution Cycle...")
        
        # 1. Health Check & Auto-Heal
        heal_status = self.node.auto_heal()
        if "restarted" not in heal_status:
            print("✅ " + heal_status)

        # 2. Traffic Analysis & Optimization
        traffic = {"eu_load": random.randint(40, 90), "latency": random.randint(50, 150)}
        route_strategy = self.evolution.optimize_routing(traffic)
        print(f"🔄 Routing Strategy Updated: {route_strategy}")

        # 3. Auto-Scaling
        system_load = traffic["eu_load"]
        scale_action = self.scaler.scale(system_load)
        
        # 4. Deployment Logic Adjustment
        metrics = {"cost": random.randint(50, 90), "latency": traffic["latency"]}
        deploy_strategy = self.deployer.update_strategy(metrics)

        # 5. Security & Mesh Sync
        print("🔐 Security Layer: Adaptive Zero-Trust Active. Keys rotated.")
        print("🛰️ [AI Mesh] Broadcasting intelligence updates to global cluster...")
        
        return {
            "status": "Evolution cycle complete",
            "route_strategy": route_strategy,
            "scale_action": scale_action,
            "deploy_strategy": deploy_strategy
        }

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "loop":
        system = SelfAdaptiveNodeSystem()
        result = system.run_feedback_loop()
        print("\n[SYSTEM STATE]")
        print(json.dumps(result, indent=2))
    elif len(sys.argv) > 1 and sys.argv[1] == "start":
        print("🚀 Starting FRC Self-Adaptive Node (Level 7)...")
        system = SelfAdaptiveNodeSystem()
        try:
            while True:
                system.run_feedback_loop()
                print("-" * 50)
                time.sleep(5)
        except KeyboardInterrupt:
            print("\nShutting down self-adaptive system.")
    else:
        print("Usage: python3 self_adaptive_node.py start | loop")
