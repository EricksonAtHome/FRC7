#!/bin/bash
echo "Installing FRC Level 5 Headless Node..."
mkdir -p /opt/frc
cp -r ./frc-node/* /opt/frc/
chmod +x /opt/frc/node.py
echo "✅ FRC Node installed."
echo "🚀 Run node with: python3 /opt/frc/node.py start"
