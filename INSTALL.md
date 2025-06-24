# 🚀 Quick Installation Guide

## Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Linux/Unix system

## One-Command Setup

```bash
# Make setup script executable and run it
chmod +x setup.sh && ./setup.sh
```

## Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Install yt-dlp globally
pip install yt-dlp
# or
npm install -g yt-dlp

# 3. Start the application
npm start
```

## Usage

1. Open http://localhost:5173 in your browser
2. Paste a YouTube playlist URL
3. Click "Download Playlist"
4. Wait for the download to complete
5. Download your files from the list

## Example URLs

- Playlist: `https://www.youtube.com/playlist?list=PLxxxxxxxx`
- Video: `https://www.youtube.com/watch?v=xxxxxxxx`

## Troubleshooting

If you encounter issues:

1. **yt-dlp not found**: Run `pip install yt-dlp` or `npm install -g yt-dlp`
2. **Permission errors**: Use `sudo` for global installations
3. **Port conflicts**: Kill processes using ports 3001 or 5173

## Support

Check the main README.md for detailed documentation and troubleshooting. 