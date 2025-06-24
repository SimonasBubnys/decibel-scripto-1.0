# 🎵 DecibelScripto 1.0 - YouTube Audio Downloader

**Created by Cinnect Media**

A modern web application for downloading YouTube videos and playlists as high-quality WAV audio files. Built with Svelte frontend and Node.js backend, featuring real-time progress updates, batch downloads, and comprehensive error handling.

## ✨ Features

- **Modern Web Interface**: Clean, responsive Svelte-based UI with tabbed interface
- **Real-time Progress**: Live download progress with detailed status updates via WebSocket
- **High-Quality Audio**: Downloads in WAV format for best audio quality
- **Multiple Download Methods**: 
  - Single URL download
  - Batch download via text file upload
- **Anti-Detection**: Advanced measures to bypass YouTube's bot protection
- **Error Resilience**: Continues downloading even if some videos fail
- **File Management**: Automatic organization in downloads directory
- **Cross-Platform**: Works on Linux, macOS, and Windows

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **yt-dlp** (YouTube downloader)
- **ffmpeg** (for audio conversion)
- **Python3** (for cookie extraction)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/decibel-scripto-1.0.git
cd decibel-scripto-1.0
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install system dependencies:**

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install yt-dlp ffmpeg python3
```

**macOS (with Homebrew):**
```bash
brew install yt-dlp ffmpeg python3
```

**Windows:**
```bash
# Install via chocolatey
choco install yt-dlp ffmpeg python3

# Or download from official websites
```

4. **Setup YouTube authentication (REQUIRED):**
```bash
# Run the automatic cookie extraction script
./setup_cookies.sh

# Or manually follow the instructions in extract_cookies.md
```

5. **Start the application:**
```bash
npm start
```

6. **Open your browser:**
Navigate to `http://localhost:5173`

## 🔧 Authentication Setup

YouTube has strict anti-bot measures. To download protected content, you need to provide your browser cookies.

### Automatic Setup (Recommended)
```bash
./setup_cookies.sh
```

### Manual Setup
1. Install a browser extension:
   - **Firefox**: Cookie Quick Manager
   - **Chrome**: EditThisCookie
2. Go to https://youtube.com and sign in
3. Export your cookies to `cookies.txt` in the project directory
4. See `extract_cookies.md` for detailed instructions

## 📖 Usage

### Single URL Download
1. Go to the "Single Download" tab
2. Enter a YouTube video URL in the input field
3. Click "Download" to start
4. Monitor progress in real-time
5. Find downloaded files in the `downloads/` directory

### Batch Download
1. Go to the "Batch Download" tab
2. Create a text file with one YouTube URL per line
3. Upload the text file using the file input
4. Click "Download All" to start batch processing
5. Monitor progress for all downloads

### Supported URL Formats
- `https://youtube.com/watch?v=...`
- `https://www.youtube.com/watch?v=...`
- `https://youtu.be/...`
- `https://youtube.com/playlist?list=...`

## 🛠️ Project Structure

```
decibel-scripto-1.0/
├── src/                    # Svelte frontend source
│   ├── app.css            # Global styles
│   ├── app.html           # HTML template
│   └── routes/            # SvelteKit routes
│       ├── +layout.svelte # Layout component
│       └── +page.svelte   # Main page component
├── server/                # Node.js backend
│   └── index.js          # Express server with Socket.IO
├── static/               # Static assets
│   └── favicon.png       # App icon
├── downloads/            # Downloaded audio files
├── cookies.txt           # YouTube authentication cookies
├── setup_cookies.sh      # Cookie extraction script
├── extract_cookies.md    # Manual cookie setup guide
├── setup.sh             # Initial setup script
├── start.sh             # Application startup script
├── package.json         # Node.js dependencies
├── svelte.config.js     # SvelteKit configuration
├── vite.config.js       # Vite configuration
└── jsconfig.json        # JavaScript configuration
```

## 🔧 Dependencies

### Frontend (Svelte)
- **SvelteKit**: Full-stack web framework
- **Socket.IO Client**: Real-time communication
- **Vite**: Build tool and dev server

### Backend (Node.js)
- **Express**: Web server framework
- **Socket.IO**: Real-time bidirectional communication
- **Multer**: File upload handling
- **CORS**: Cross-origin resource sharing
- **Child Process**: yt-dlp integration

### System Dependencies
- **yt-dlp**: YouTube video downloader
- **ffmpeg**: Audio/video processing
- **Python3**: Cookie extraction scripts

## 🌐 GitHub Integration

### Setting up GitHub Authentication

1. **Create a GitHub Personal Access Token:**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow`
   - Copy the generated token

2. **Configure Git with your credentials:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

3. **Store your GitHub token:**
```bash
# Option 1: Use Git credential helper
git config --global credential.helper store
# When prompted, use your token as the password

# Option 2: Use GitHub CLI
gh auth login
```

### Contributing to the Repository

1. **Fork the repository** on GitHub
2. **Clone your fork:**
```bash
git clone https://github.com/yourusername/decibel-scripto-1.0.git
cd decibel-scripto-1.0
```

3. **Create a feature branch:**
```bash
git checkout -b feature/your-feature-name
```

4. **Make your changes and commit:**
```bash
git add .
git commit -m "Add your feature description"
```

5. **Push to your fork:**
```bash
git push origin feature/your-feature-name
```

6. **Create a Pull Request** on GitHub

### GitHub Workflow

```bash
# Daily development workflow
git pull origin main          # Get latest changes
npm install                   # Update dependencies if needed
npm start                     # Start development server
# Make changes...
git add .
git commit -m "Description of changes"
git push origin your-branch
```

## 🔍 Troubleshooting

### Common Issues

**"Sign in to confirm you're not a bot"**
- Run `./setup_cookies.sh` to extract your browser cookies
- Make sure you're signed into YouTube in your browser
- Try clearing browser cookies and signing in again

**"HTTP Error 403: Forbidden"**
- Ensure cookies.txt is properly formatted and up-to-date
- Try downloading fewer videos at once
- Check if yt-dlp is up to date: `yt-dlp -U`

**"yt-dlp not found"**
- Install yt-dlp: `sudo apt install yt-dlp`
- Or: `pip install yt-dlp`
- Verify installation: `yt-dlp --version`

**"ffmpeg not found"**
- Install ffmpeg: `sudo apt install ffmpeg`
- Or: `brew install ffmpeg` (macOS)
- Verify installation: `ffmpeg -version`

**Port conflicts**
```bash
# Kill processes on ports
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Debug Mode
Enable verbose logging by checking:
- Browser console (F12 → Console)
- Server logs in terminal
- yt-dlp verbose output in server logs

## 📝 License

This project is created by **Cinnect Media** and is for educational purposes. Please respect YouTube's terms of service and copyright laws.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

## ⚠️ Disclaimer

This tool is designed for personal use and educational purposes. Users are responsible for complying with YouTube's terms of service and applicable copyright laws. The developers are not responsible for any misuse of this software.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the documentation in `extract_cookies.md`

---

**Created with ❤️ by Cinnect Media** 