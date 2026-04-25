import sys
import json
import time

class FRCExecutor:
    def __init__(self, config_path="config.json"):
        with open(config_path, "r") as f:
            self.config = json.load(f)
        self.node_id = self.config.get("node_id", "unknown-node")

    def run_model(self, model, input_data):
        if model in self.config.get("models", []):
            return self.fake_ai(input_data)
        else:
            return {"error": f"Model {model} not supported on {self.node_id}"}

    def fake_ai(self, input_data):
        time.sleep(0.5) # simulate execution latency
        return {
            "output": f"[FRC AI RESPONSE] processed: {input_data}",
            "node": self.node_id,
            "latency": "12ms",
            "status": "success"
        }

    def start(self):
        print(f"🚀 FRC Node '{self.node_id}' starting in headless mode...")
        print(f"⚙️  Type: {self.config.get('type')}")
        print(f"🤖 Loaded Models: {', '.join(self.config.get('models', []))}")
        print("📡 Listening for FRC Protocol streams (frc://)...")
        try:
            while True:
                time.sleep(10)
        except KeyboardInterrupt:
            print("\nNode shutting down.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "start":
        executor = FRCExecutor()
        executor.start()
    elif len(sys.argv) > 2 and sys.argv[1] == "run":
        model = sys.argv[2]
        input_data = sys.argv[3] if len(sys.argv) > 3 else "test input"
        executor = FRCExecutor()
        print(json.dumps(executor.run_model(model, input_data), indent=2))
    else:
        print("Usage: python3 node.py start | run <model> '<input>'")
