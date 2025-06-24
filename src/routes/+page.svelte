<script>
	import { onMount } from 'svelte';
	import { io } from 'socket.io-client';
	
	let playlistUrl = '';
	let isDownloading = false;
	let progress = 0;
	let status = '';
	let downloadedFiles = [];
	let socket;
	let downloadStats = { completed: 0, errors: 0 };
	let activeTab = 'single'; // 'single' or 'batch'
	let selectedFile = null;
	let fileInput;
	
	onMount(() => {
		// Initialize Socket.IO connection
		socket = io();
		
		socket.on('connect', () => {
			console.log('🔌 Connected to server');
		});
		
		socket.on('download-progress', (data) => {
			progress = data.progress;
			status = data.status;
			console.log('📊 Progress update:', data);
		});
		
		socket.on('download-complete', (data) => {
			isDownloading = false;
			progress = 100;
			status = 'Download completed!';
			downloadedFiles = data.files;
			console.log('✅ Download completed:', data);
		});
		
		socket.on('download-error', (data) => {
			isDownloading = false;
			status = `Error: ${data.error}`;
			console.error('❌ Download error:', data);
		});
		
		return () => {
			if (socket) {
				socket.disconnect();
			}
		};
	});
	
	async function downloadPlaylist() {
		if (!playlistUrl.trim()) {
			status = 'Please enter a playlist URL';
			return;
		}
		
		if (!playlistUrl.includes('youtube.com/playlist') && !playlistUrl.includes('youtube.com/watch?v=')) {
			status = 'Please enter a valid YouTube playlist URL';
			return;
		}
		
		isDownloading = true;
		progress = 0;
		status = 'Starting download...';
		downloadedFiles = [];
		downloadStats = { completed: 0, errors: 0 };
		
		console.log('🎵 Starting download for:', playlistUrl);
		
		try {
			const response = await fetch('/api/download', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ url: playlistUrl })
			});
			
			if (!response.ok) {
				throw new Error('Failed to start download');
			}
			
			const result = await response.json();
			if (result.error) {
				throw new Error(result.error);
			}
			
			console.log('✅ Download request sent successfully');
			status = 'Download started successfully!';
		} catch (error) {
			isDownloading = false;
			status = `Error: ${error.message}`;
			console.error('❌ Download request failed:', error);
		}
	}
	
	async function uploadFile() {
		if (!selectedFile) {Slack
			status = 'Please select a text file';
			return;
		}
		
		isDownloading = true;
		progress = 0;
		status = 'Starting batch download...';
		downloadedFiles = [];
		downloadStats = { completed: 0, errors: 0 };
		
		console.log('📁 Starting batch upload for:', selectedFile.name);
		
		try {
			const formData = new FormData();
			formData.append('file', selectedFile);
			
			const response = await fetch('/api/upload', {
				method: 'POST',
				body: formData
			});
			
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || 'Failed to upload file');
			}
			
			const result = await response.json();
			console.log('✅ Upload request sent successfully');
			status = result.message;
		} catch (error) {
			isDownloading = false;
			status = `Error: ${error.message}`;
			console.error('❌ Upload request failed:', error);
		}
	}
	
	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file && file.type === 'text/plain') {
			selectedFile = file;
			status = `Selected file: ${file.name}`;
		} else {
			selectedFile = null;
			status = 'Please select a valid .txt file';
		}
	}
	
	function clearStatus() {
		status = '';
		progress = 0;
		downloadStats = { completed: 0, errors: 0 };
	}
	
	function getFileIcon(filename) {
		if (filename.endsWith('.wav')) return '🎵';
		if (filename.endsWith('.mp3')) return '🎵';
		if (filename.endsWith('.m4a')) return '🎵';
		if (filename.endsWith('.webm')) return '🎵';
		return '📄';
	}
</script>

<svelte:head>
	<title>DecibelScripto - YouTube Playlist Downloader</title>
	<meta name="description" content="Download YouTube playlists easily with a modern web interface" />
</svelte:head>

<div class="container">
	<div class="card">
		<h1>🎵 DecibelScripto</h1>
		<p class="subtitle">Download YouTube playlists in WAV format with ease</p>
		
		<div class="tabs">
			<button 
				class="tab-btn {activeTab === 'single' ? 'active' : ''}" 
				on:click={() => activeTab = 'single'}
			>
				📥 Single URL
			</button>
			<button 
				class="tab-btn {activeTab === 'batch' ? 'active' : ''}" 
				on:click={() => activeTab = 'batch'}
			>
				📁 Batch Upload
			</button>
		</div>
		
		{#if activeTab === 'single'}
			<div class="form-group">
				<label for="playlist-url">YouTube Playlist URL:</label>
				<input
					id="playlist-url"
					type="url"
					class="input"
					placeholder="https://www.youtube.com/playlist?list=..."
					bind:value={playlistUrl}
					disabled={isDownloading}
				/>
			</div>
			
			<div class="format-info">
				<strong>📁 Format:</strong> WAV (High Quality Audio)
			</div>
			
			<button 
				class="btn" 
				on:click={downloadPlaylist}
				disabled={isDownloading || !playlistUrl.trim()}
			>
				{#if isDownloading}
					<span class="loading"></span>
					Downloading...
				{:else}
					📥 Download Playlist
				{/if}
			</button>
		{:else}
			<div class="form-group">
				<label for="file-upload">Upload Text File:</label>
				<div class="file-upload-area">
					<input
						id="file-upload"
						type="file"
						accept=".txt"
						bind:this={fileInput}
						on:change={handleFileSelect}
						disabled={isDownloading}
					/>
					<div class="file-upload-text">
						📁 Click to select a .txt file
						<br>
						<small>Each line should contain one YouTube URL</small>
					</div>
				</div>
			</div>
			
			<div class="format-info">
				<strong>📋 File Format:</strong> One YouTube URL per line
				<br>
				<strong>📁 Output Format:</strong> WAV (High Quality Audio)
			</div>
			
			<button 
				class="btn" 
				on:click={uploadFile}
				disabled={isDownloading || !selectedFile}
			>
				{#if isDownloading}
					<span class="loading"></span>
					Processing...
				{:else}
					📁 Upload & Download
				{/if}
			</button>
		{/if}
		
		{#if isDownloading}
			<div class="progress-container">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progress}%"></div>
				</div>
				<p class="progress-text">{progress}% complete</p>
				{#if downloadStats.completed > 0 || downloadStats.errors > 0}
					<p class="stats-text">
						✅ {downloadStats.completed} completed
						{#if downloadStats.errors > 0}
							❌ {downloadStats.errors} errors
						{/if}
					</p>
				{/if}
			</div>
		{/if}
		
		{#if status}
			<div class="status {status.includes('Error') ? 'error' : status.includes('completed') ? 'success' : 'info'}">
				{status}
				{#if status.includes('File saved as:') || status.includes('completed')}
					<div class="download-info">
						<strong>📁 Downloads folder:</strong> /home/simon/dev/decibelscripto/downloads
						<br>
						<small>Files are saved in WAV format. You can access them from the downloads section below or directly from the folder.</small>
						<br>
						<button class="refresh-btn" on:click={() => window.location.reload()}>
							🔄 Refresh Downloads List
						</button>
					</div>
				{/if}
				{#if !isDownloading && status}
					<button class="clear-btn" on:click={clearStatus}>×</button>
				{/if}
			</div>
		{/if}
		
		{#if downloadedFiles.length > 0}
			<div class="downloads-section">
				<h3>📁 Downloaded Files ({downloadedFiles.length})</h3>
				<ul class="file-list">
					{#each downloadedFiles as file}
						<li class="file-item">
							<div class="file-info">
								<span class="file-icon">{getFileIcon(file.name)}</span>
								<span class="file-name">{file.name}</span>
								<span class="file-size">{file.size}</span>
							</div>
							<a href="/downloads/{file.filename}" class="file-link" download>
								📥 Download
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>

<style>
	h1 {
		text-align: center;
		color: #2d3748;
		margin-bottom: 0.5rem;
		font-size: 2.5rem;
		font-weight: 700;
	}
	
	.subtitle {
		text-align: center;
		color: #718096;
		margin-bottom: 2rem;
		font-size: 1.1rem;
	}
	
	.tabs {
		display: flex;
		margin-bottom: 2rem;
		border-bottom: 2px solid #e2e8f0;
	}
	
	.tab-btn {
		flex: 1;
		padding: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		color: #718096;
		transition: all 0.3s ease;
	}
	
	.tab-btn:hover {
		color: #4a5568;
		background-color: #f7fafc;
	}
	
	.tab-btn.active {
		color: #3182ce;
		border-bottom: 2px solid #3182ce;
		background-color: #ebf8ff;
	}
	
	.form-group {
		margin-bottom: 1.5rem;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		color: #2d3748;
	}
	
	.input {
		width: 100%;
		padding: 0.75rem;
		border: 2px solid #e2e8f0;
		border-radius: 8px;
		font-size: 1rem;
		transition: border-color 0.3s ease;
	}
	
	.input:focus {
		outline: none;
		border-color: #3182ce;
	}
	
	.file-upload-area {
		position: relative;
		border: 2px dashed #cbd5e0;
		border-radius: 8px;
		padding: 2rem;
		text-align: center;
		transition: border-color 0.3s ease;
		cursor: pointer;
	}
	
	.file-upload-area:hover {
		border-color: #3182ce;
	}
	
	.file-upload-area input[type="file"] {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
	}
	
	.file-upload-text {
		color: #718096;
		font-size: 1rem;
	}
	
	.file-upload-text small {
		color: #a0aec0;
		font-size: 0.875rem;
	}
	
	.format-info {
		background: #e6fffa;
		border: 1px solid #81e6d9;
		border-radius: 8px;
		padding: 12px;
		margin-bottom: 1.5rem;
		color: #2c7a7b;
		font-size: 0.9rem;
	}
	
	.btn {
		width: 100%;
		padding: 1rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
	
	.btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
	}
	
	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
	
	.loading {
		width: 20px;
		height: 20px;
		border: 2px solid #ffffff;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.progress-container {
		margin: 1.5rem 0;
	}
	
	.progress-bar {
		width: 100%;
		height: 8px;
		background: #e2e8f0;
		border-radius: 4px;
		overflow: hidden;
	}
	
	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #667eea, #764ba2);
		transition: width 0.3s ease;
	}
	
	.progress-text {
		text-align: center;
		font-weight: 600;
		color: #2d3748;
		margin-top: 0.5rem;
	}
	
	.stats-text {
		text-align: center;
		font-size: 0.9rem;
		color: #718096;
		margin-top: 0.5rem;
	}
	
	.status {
		padding: 1rem;
		border-radius: 8px;
		margin: 1rem 0;
		position: relative;
	}
	
	.status.info {
		background: #ebf8ff;
		color: #2b6cb0;
		border: 1px solid #bee3f8;
	}
	
	.status.success {
		background: #f0fff4;
		color: #2f855a;
		border: 1px solid #c6f6d5;
	}
	
	.status.error {
		background: #fed7d7;
		color: #c53030;
		border: 1px solid #feb2b2;
	}
	
	.clear-btn {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		float: right;
		color: inherit;
		opacity: 0.7;
	}
	
	.clear-btn:hover {
		opacity: 1;
	}
	
	.download-info {
		margin-top: 1rem;
		padding: 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		font-size: 0.9rem;
	}
	
	.refresh-btn {
		margin-top: 0.5rem;
		padding: 0.5rem 1rem;
		background: #3182ce;
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background-color 0.3s ease;
	}
	
	.refresh-btn:hover {
		background: #2c5aa0;
	}
	
	.downloads-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid #e2e8f0;
	}
	
	.downloads-section h3 {
		color: #2d3748;
		margin-bottom: 1rem;
	}
	
	.file-list {
		list-style: none;
		padding: 0;
	}
	
	.file-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		margin-bottom: 0.5rem;
		transition: background-color 0.3s ease;
	}
	
	.file-item:hover {
		background-color: #f7fafc;
	}
	
	.file-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}
	
	.file-icon {
		font-size: 1.2rem;
	}
	
	.file-name {
		font-weight: 500;
		color: #4a5568;
		flex: 1;
	}
	
	.file-size {
		font-size: 0.8rem;
		color: #718096;
	}
	
	.file-link {
		padding: 0.5rem 1rem;
		background: #3182ce;
		color: white;
		text-decoration: none;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.3s ease;
	}
	
	.file-link:hover {
		background: #2c5aa0;
	}
	
	@media (max-width: 768px) {
		.container {
			padding: 1rem;
		}
		
		.card {
			padding: 1.5rem;
		}
		
		h1 {
			font-size: 2rem;
		}
		
		.tabs {
			flex-direction: column;
		}
		
		.tab-btn {
			border-bottom: 1px solid #e2e8f0;
		}
		
		.tab-btn.active {
			border-bottom: 2px solid #3182ce;
		}
		
		.file-info {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.25rem;
		}
		
		.file-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.file-link {
			align-self: stretch;
			text-align: center;
		}
	}
</style> 