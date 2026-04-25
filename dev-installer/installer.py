import customtkinter as ctk
from tkinter import filedialog, messagebox, simpledialog
import subprocess
import os
import threading
import json

# Set appearance and theme
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

class FRCBrain:
    def generate(self, prompt):
        features = self.analyze(prompt)
        return {
            "stack": "nextjs",
            "features": features,
            "services": ["auth", "api-bridge", "database", "frc-connect"],
            "docker": True,
            "deployment": "frc.cloud",
            "region": "eu-central"
        }

    def analyze(self, prompt):
        prompt = prompt.lower()
        features = []
        if "saas" in prompt: features += ["dashboard", "billing", "users"]
        if "ai" in prompt: features += ["model-api", "chat-ui"]
        if not features: features = ["basic-app"]
        return list(set(features))

class FRCLDevOS_L4(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("FRCL DevOS - LEVEL 4 ORCHESTRATOR")
        self.geometry("950x650")

        self.brain = FRCBrain()
        self.path = ""
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # Sidebar
        self.sidebar_frame = ctk.CTkFrame(self, width=200, corner_radius=0)
        self.sidebar_frame.grid(row=0, column=0, sticky="nsew")
        
        self.logo = ctk.CTkLabel(self.sidebar_frame, text="FRC DevOS", font=ctk.CTkFont(size=24, weight="bold"))
        self.logo.grid(row=0, column=0, padx=20, pady=20)

        self.btn_gen = ctk.CTkButton(self.sidebar_frame, text="🚀 Build Project", height=50, fg_color="#A020F0", command=self.run_ai_build)
        self.btn_gen.grid(row=1, column=0, padx=20, pady=20)

        # Main Panel
        self.main_frame = ctk.CTkFrame(self, corner_radius=15)
        self.main_frame.grid(row=0, column=1, padx=20, pady=20, sticky="nsew")
        self.main_frame.grid_columnconfigure(0, weight=1)

        self.label = ctk.CTkLabel(self.main_frame, text="System Orchestration Platform", font=ctk.CTkFont(size=28, weight="bold"))
        self.label.grid(row=0, column=0, padx=20, pady=20)

        self.path_btn = ctk.CTkButton(self.main_frame, text="Select Workspace", command=self.select_path)
        self.path_btn.grid(row=1, column=0, padx=20, pady=10)

        self.status = ctk.CTkLabel(self.main_frame, text="Status: Ready", text_color="gray")
        self.status.grid(row=2, column=0, padx=20, pady=5)

        self.console = ctk.CTkTextbox(self.main_frame, height=350, font=("Courier", 14))
        self.console.grid(row=3, column=0, padx=20, pady=20, sticky="nsew")
        
        self.log("DevOS Kernel v4.0.1 Loaded.")
        self.log("Waiting for user command...")

    def log(self, msg):
        self.console.insert("end", f"> {msg}\n")
        self.console.see("end")

    def select_path(self):
        self.path = filedialog.askdirectory()
        if self.path:
            self.status.configure(text=f"Workspace: {self.path}", text_color="cyan")
            self.log(f"Path selected: {self.path}")

    def run_ai_build(self):
        if not self.path: return messagebox.showerror("Error", "Select workspace first")
        
        prompt = simpledialog.askstring("FRC Brain", "What project do you want to build? (e.g. 'SaaS with AI dashboard')")
        if not prompt: return
        
        threading.Thread(target=self._orchestrate, args=(prompt,)).start()

    def _orchestrate(self, prompt):
        self.log(f"🧠 ANALYZING PROMPT: '{prompt}'")
        
        # 1. AI Blueprint
        config = self.brain.generate(prompt)
        self.log(f"✅ Generated Blueprint: {config['features']}")

        # 2. Scaffolding
        os.makedirs(os.path.join(self.path, "src"), exist_ok=True)
        os.makedirs(os.path.join(self.path, "infra"), exist_ok=True)
        os.makedirs(os.path.join(self.path, "demo"), exist_ok=True)
        
        with open(os.path.join(self.path, "frc.project.json"), "w") as f:
            json.dump(config, f, indent=2)
        
        # 3. Deploy Layer
        with open(os.path.join(self.path, "deploy.frc"), "w") as f:
            f.write(f"deploy {{\n  target: {config['deployment']}\n  runtime: docker\n  region: {config['region']}\n  autoscale: true\n  network: 5g-optimized\n}}")
        self.log("📡 Generated Level 4 Cloud Deploy Config (deploy.frc)")

        # 4. FRC Cloud Connection Layer
        with open(os.path.join(self.path, "src", "frc-connect.js"), "w") as f:
            f.write("export const frc = {\n  connect: async (model, input) => {\n    return fetch('https://frc.systems/run/' + model, {\n      method: 'POST',\n      headers: { 'Authorization': 'Bearer frc_token' },\n      body: JSON.stringify({ input })\n    });\n  }\n};")
        self.log("🔗 Injected FRC System Connection Layer")

        # 5. Docker L4
        with open(os.path.join(self.path, "Dockerfile"), "w") as f:
            f.write("FROM node:20\nWORKDIR /app\nCOPY . .\nRUN npm install\nRUN apt-get update && apt-get install -y php python3\nEXPOSE 3000 80\nCMD [\"npm\", \"run\", \"dev\"]")
        self.log("🐳 Orchestrated L4 Docker Stack")

        self.log("🚀 LEVEL 4 PROJECT DEPLOYED TO WORKSPACE.")
        messagebox.showinfo("DevOS", "Level 4 Project Generation Complete!")

if __name__ == "__main__":
    app = FRCLDevOS_L4()
    app.mainloop()
