import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { spawn, execSync } from 'child_process';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "http://localhost:5173",
		methods: ["GET", "POST"]
	}
});

// Configure multer for file uploads
const upload = multer({ 
	dest: '/tmp/',
	fileFilter: (req, file, cb) => {
		if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
			cb(null, true);
		} else {
			cb(new Error('Only .txt files are allowed'));
		}
	}
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../static')));

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, '../downloads');
fs.ensureDirSync(downloadsDir);

// Serve downloaded files
app.use('/downloads', express.static(downloadsDir));

// Socket.IO connection handling
io.on('connection', (socket) => {
	console.log('🔌 Client connected:', socket.id);
	
	socket.on('disconnect', () => {
		console.log('🔌 Client disconnected:', socket.id);
	});
});

// Download endpoint for single URL
app.post('/api/download', async (req, res) => {
	const { url } = req.body;
	
	console.log('📥 Download request received for URL:', url);
	
	if (!url) {
		console.log('❌ Error: URL is required');
		return res.status(400).json({ error: 'URL is required' });
	}
	
	if (!url.includes('youtube.com')) {
		console.log('❌ Error: Invalid YouTube URL');
		return res.status(400).json({ error: 'Invalid YouTube URL' });
	}
	
	try {
		// Start download process
		await downloadPlaylist(url, io);
		
		console.log('✅ Download process started successfully');
		res.json({ message: 'Download started' });
	} catch (error) {
		console.error('❌ Download error:', error);
		res.status(500).json({ error: error.message });
	}
});

// Upload text file endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' });
	}
	
	console.log('📁 Text file upload received:', req.file.originalname);
	
	try {
		// Read the uploaded file
		const fileContent = await fs.readFile(req.file.path, 'utf8');
		const urls = fileContent.split('\n')
			.map(line => line.trim())
			.filter(line => line && line.includes('youtube.com'));
		
		console.log(`📋 Found ${urls.length} YouTube URLs in file`);
		
		if (urls.length === 0) {
			await fs.remove(req.file.path);
			return res.status(400).json({ error: 'No valid YouTube URLs found in file' });
		}
		
		// Clean up the uploaded file
		await fs.remove(req.file.path);
		
		// Start downloading all URLs
		await downloadMultipleUrls(urls, io);
		
		console.log('✅ Multiple downloads started successfully');
		res.json({ message: `Started downloading ${urls.length} URLs` });
	} catch (error) {
		console.error('❌ File upload error:', error);
		// Clean up the uploaded file on error
		if (req.file) {
			await fs.remove(req.file.path).catch(() => {});
		}
		res.status(500).json({ error: error.message });
	}
});

async function downloadMultipleUrls(urls, io) {
	console.log(`🎵 Starting batch download for ${urls.length} URLs`);
	
	io.emit('download-progress', {
		progress: 0,
		status: `Starting batch download of ${urls.length} URLs...`
	});
	
	let completed = 0;
	let errors = 0;
	
	for (let i = 0; i < urls.length; i++) {
		const url = urls[i];
		const progress = Math.round((i / urls.length) * 100);
		
		io.emit('download-progress', {
			progress,
			status: `Downloading ${i + 1}/${urls.length}: ${url}`
		});
		
		try {
			await downloadPlaylist(url, io, true); // true = batch mode
			completed++;
		} catch (error) {
			console.error(`❌ Error downloading ${url}:`, error.message);
			errors++;
		}
	}
	
	io.emit('download-progress', {
		progress: 100,
		status: `Batch download completed! ${completed} successful, ${errors} failed.`
	});
}

async function downloadPlaylist(url, io, batchMode = false) {
	console.log('🎵 Starting download for:', url);
	
	// Ensure downloads directory exists
	if (!fs.existsSync(downloadsDir)) {
		fs.mkdirSync(downloadsDir, { recursive: true });
		console.log('📁 Created downloads directory');
	}

	if (!batchMode) {
		io.emit('download-progress', {
			progress: 0,
			status: 'Starting download...'
		});
	}

	// Use the yt-dlp binary from env or default
	const ytdlpBin = process.env.YTDLP_PATH || 'yt-dlp';
	console.log('🔧 Debug: Using yt-dlp binary:', ytdlpBin);
	
	// Test if yt-dlp is available
	try {
		const version = execSync(`${ytdlpBin} --version`, { encoding: 'utf8' }).trim();
		console.log('✅ Debug: yt-dlp version:', version);
	} catch (error) {
		console.log('❌ Debug: yt-dlp not found or not working:', error.message);
		io.emit('download-error', { error: 'yt-dlp not found or not working' });
		return;
	}

	// Prepare yt-dlp command arguments - simplified as requested
	const args = [
		url,
		'-x',
		'--audio-format', 'wav',
		'-o', path.join(downloadsDir, '%(title)s.%(ext)s'),
		'--verbose'
	];

	// Add cookies file if it exists
	const cookiesPath = path.join(__dirname, '../cookies.txt');
	if (fs.existsSync(cookiesPath)) {
		args.push('--cookies', cookiesPath);
		console.log('🍪 Using cookies file for authentication');
	} else {
		console.log('⚠️  No cookies.txt file found. Some videos may require authentication.');
	}

	console.log('🔧 yt-dlp command args:', args.join(' '));
	console.log('📁 Downloads will be saved to:', downloadsDir);

	// Function to try different yt-dlp configurations
	const tryDownload = async (configArgs, attempt = 1) => {
		return new Promise((resolve, reject) => {
			console.log(`🔄 Attempt ${attempt} with configuration ${attempt === 1 ? '(simple)' : '(fallback)'}`);
			
			const ytdlp = spawn(ytdlpBin, configArgs, {
				cwd: downloadsDir // Set working directory to downloads folder
			});
			
			let stdout = '';
			let stderr = '';
			let errorCount = 0;
			let successCount = 0;
			let lineCount = 0;
			let downloadedFile = '';

			ytdlp.stdout.on('data', (data) => {
				const output = data.toString();
				stdout += output;
				lineCount++;
				
				console.log(`📤 yt-dlp stdout: ${output.trim()}`);
				
				// Parse progress from yt-dlp output
				const lines = output.split('\n');
				lines.forEach(line => {
					if (line.includes('[download]') && line.includes('%')) {
						const match = line.match(/(\d+\.?\d*)%/);
						if (match) {
							const progress = parseFloat(match[1]);
							if (!batchMode) {
								io.emit('download-progress', { progress, status: line.trim() });
							}
						}
					} else if (line.includes('ERROR:')) {
						errorCount++;
						if (!batchMode) {
							io.emit('download-progress', { progress: 0, status: `Warning: ${line.trim()}` });
						}
					} else if (line.includes('has already been downloaded')) {
						successCount++;
						if (!batchMode) {
							io.emit('download-progress', { progress: 0, status: `✅ ${line.trim()}` });
						}
					} else if (line.includes('[ffmpeg] Destination:')) {
						// Extract the downloaded file path
						const match = line.match(/Destination: (.+)/);
						if (match) {
							downloadedFile = match[1].trim();
							console.log(`📁 File saved to: ${downloadedFile}`);
						}
					} else if (line.includes('has already been downloaded')) {
						successCount++;
						if (!batchMode) {
							io.emit('download-progress', { progress: 0, status: `✅ ${line.trim()}` });
						}
					}
				});
			});

			ytdlp.stderr.on('data', (data) => {
				const output = data.toString();
				stderr += output;
				console.log(`⚠️  yt-dlp stderr:`, output.trim());
			});

			ytdlp.on('close', (code) => {
				console.log(`📊 Download process exited with code ${code}`);
				console.log(`📈 Success count: ${successCount}, Error count: ${errorCount}`);
				
				// Check what files are in the downloads directory
				try {
					const files = fs.readdirSync(downloadsDir);
					console.log(`📂 Files in downloads directory:`, files);
					
					const wavFiles = files.filter(f => f.endsWith('.wav'));
					console.log(`🎵 WAV files found:`, wavFiles);
					
					if (wavFiles.length > 0) {
						const latestFile = wavFiles[wavFiles.length - 1];
						const filePath = path.join(downloadsDir, latestFile);
						const stats = fs.statSync(filePath);
						console.log(`✅ Latest WAV file: ${latestFile} (${stats.size} bytes)`);
						downloadedFile = filePath;
					}
				} catch (err) {
					console.log(`❌ Error reading downloads directory:`, err.message);
				}
				
				if (code === 0 || successCount > 0 || downloadedFile) {
					// Check if file was actually created
					if (downloadedFile && fs.existsSync(downloadedFile)) {
						console.log(`✅ File successfully downloaded to: ${downloadedFile}`);
						resolve({ success: true, stdout, stderr, code, successCount, errorCount, downloadedFile });
					} else {
						// Check downloads directory for any WAV files
						try {
							const files = fs.readdirSync(downloadsDir).filter(f => f.endsWith('.wav'));
							if (files.length > 0) {
								const latestFile = files[files.length - 1];
								const filePath = path.join(downloadsDir, latestFile);
								console.log(`✅ File found in downloads directory: ${filePath}`);
								resolve({ success: true, stdout, stderr, code, successCount, errorCount, downloadedFile: filePath });
							} else {
								console.log(`❌ No WAV files found in downloads directory`);
								resolve({ success: true, stdout, stderr, code, successCount, errorCount });
							}
						} catch (err) {
							console.log(`❌ Error checking downloads directory:`, err.message);
							resolve({ success: true, stdout, stderr, code, successCount, errorCount });
						}
					}
				} else if (attempt < 3 && (stderr.includes('Sign in to confirm') || stderr.includes('403: Forbidden'))) {
					reject(new Error('AUTH_FAILED'));
				} else {
					resolve({ success: false, stdout, stderr, code, successCount, errorCount });
				}
			});

			ytdlp.on('error', (err) => {
				console.log(`❌ yt-dlp process error: ${err.message}`);
				reject(err);
			});
		});
	};

	// Try download with fallback configurations
	try {
		let result = await tryDownload(args, 1);
		
		// If first attempt fails with auth error, try fallback
		if (!result.success && result.stderr.includes('Sign in to confirm')) {
			console.log('🔄 Trying fallback configuration...');
			
			// Fallback configuration - even simpler
			const fallbackArgs = [
				url,
				'-x',
				'--audio-format', 'wav',
				'-o', path.join(downloadsDir, '%(title)s.%(ext)s'),
				'--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			];
			
			if (fs.existsSync(cookiesPath)) {
				fallbackArgs.push('--cookies', cookiesPath);
			}
			
			result = await tryDownload(fallbackArgs, 2);
		}
		
		// Final result handling
		if (result.success || result.successCount > 0 || result.downloadedFile) {
			console.log(`✅ Download completed successfully!`);
			let statusMessage = `✅ Download completed! ${result.successCount} files downloaded successfully.`;
			
			if (result.downloadedFile) {
				const fileName = path.basename(result.downloadedFile);
				statusMessage += ` File saved as: ${fileName}`;
				console.log(`📁 Download location: ${result.downloadedFile}`);
				
				// Emit file info to frontend
				if (!batchMode) {
					io.emit('download-complete', {
						files: [{
							name: fileName,
							filename: fileName,
							size: 'Downloaded'
						}]
					});
				}
			} else {
				statusMessage += ` Check downloads folder for files.`;
			}
			
			if (!batchMode) {
				io.emit('download-progress', { progress: 100, status: statusMessage });
			}
		} else {
			console.log(`❌ Download failed with code ${result.code}`);
			if (!batchMode) {
				io.emit('download-error', {
					error: `Download failed with exit code ${result.code}. ${result.successCount} files downloaded, ${result.errorCount} errors.`
				});
			}
		}
		
	} catch (error) {
		if (error.message === 'AUTH_FAILED') {
			console.log('❌ Authentication failed after all attempts');
			if (!batchMode) {
				io.emit('download-error', {
					error: 'Authentication failed. Please run ./setup_cookies.sh and sign into YouTube in your browser.'
				});
			}
		} else {
			console.log(`❌ Download error: ${error.message}`);
			if (!batchMode) {
				io.emit('download-error', {
					error: `Download error: ${error.message}`
				});
			}
		}
		throw error;
	}
}

async function getDownloadedFiles() {
	try {
		console.log('🔍 Scanning for downloaded files...');
		const files = [];
		const items = await fs.readdir(downloadsDir);
		console.log('📂 Found items in downloads directory:', items);
		
		for (const item of items) {
			const itemPath = path.join(downloadsDir, item);
			const stats = await fs.stat(itemPath);
			
			if (stats.isFile()) {
				// Check if it's an audio file
				if (item.endsWith('.wav') || item.endsWith('.mp3') || item.endsWith('.m4a') || item.endsWith('.webm')) {
					console.log('📄 Found audio file:', item);
					files.push({
						name: item,
						filename: item,
						size: formatFileSize(stats.size)
					});
				}
			} else if (stats.isDirectory()) {
				// If it's a directory (playlist), get files from it
				try {
					console.log('📁 Scanning playlist directory:', item);
					const playlistFiles = await fs.readdir(itemPath);
					console.log('📄 Files in playlist directory:', playlistFiles);
					
					for (const file of playlistFiles) {
						if (file.endsWith('.wav') || file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.webm')) {
							const filePath = path.join(itemPath, file);
							const fileStats = await fs.stat(filePath);
							console.log('🎵 Found audio file in playlist:', file);
							files.push({
								name: file,
								filename: `${item}/${file}`,
								size: formatFileSize(fileStats.size)
							});
						}
					}
				} catch (dirError) {
					console.warn(`⚠️  Could not read directory ${item}:`, dirError.message);
				}
			}
		}
		
		console.log(`📊 Total audio files found: ${files.length}`);
		return files;
	} catch (error) {
		console.error('❌ Error getting downloaded files:', error);
		return [];
	}
}

function formatFileSize(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Health check endpoint
app.get('/api/health', (req, res) => {
	console.log('🏥 Health check requested');
	res.json({ 
		status: 'OK', 
		timestamp: new Date().toISOString(),
		ytdlp: 'Available'
	});
});

// Get downloaded files endpoint
app.get('/api/files', async (req, res) => {
	console.log('📁 Files list requested');
	try {
		const files = await getDownloadedFiles();
		res.json({ files });
	} catch (error) {
		console.error('❌ Error getting files list:', error);
		res.status(500).json({ error: error.message });
	}
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`📁 Downloads directory: ${downloadsDir}`);
	console.log(`🌐 Frontend: http://localhost:5173`);
	console.log(`🔗 API: http://localhost:${PORT}/api`);
}); 