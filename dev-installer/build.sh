#!/bin/bash
# FRCL Dev Studio Build Script

echo "🔧 Installing build dependencies..."
pip3 install -r requirements.txt

echo "🚀 Building Desktop App (PyInstaller)..."
# We use --noconsole for a clean GUI app
pyinstaller --onefile --noconsole --name "FRCL_Dev_Studio" installer.py

echo "✅ Build complete! Find your app in the 'dist' folder."
