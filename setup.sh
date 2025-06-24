#!/bin/bash

echo "🎵 DecibelScripto Setup Script"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install npm dependencies"
    exit 1
fi

# Check if yt-dlp is installed
if ! command -v yt-dlp &> /dev/null; then
    echo "📥 Installing yt-dlp..."
    
    # Try pip first
    if command -v pip3 &> /dev/null; then
        pip3 install yt-dlp
    elif command -v pip &> /dev/null; then
        pip install yt-dlp
    else
        echo "❌ pip not found. Installing yt-dlp via npm..."
        npm install -g yt-dlp
    fi
fi

# Verify yt-dlp installation
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp installed: $(yt-dlp --version)"
else
    echo "❌ Failed to install yt-dlp"
    exit 1
fi

# Create downloads directory
echo "📁 Creating downloads directory..."
mkdir -p downloads

# Set permissions
echo "🔐 Setting permissions..."
chmod +x setup.sh

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To start the application:"
echo "  npm start"
echo ""
echo "This will start:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:3001"
echo ""
echo "Happy downloading! 🎵" 