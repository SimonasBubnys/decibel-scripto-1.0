#!/bin/bash

echo "🎵 Starting DecibelScripto..."
echo "=============================="

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not found. Running setup first..."
    ./setup.sh
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "❌ yt-dlp not found. Please run ./setup.sh first"
    exit 1
fi

# Start the application
echo "🚀 Starting application..."
npm start 