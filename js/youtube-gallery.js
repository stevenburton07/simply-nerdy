/**
 * Simply Nerdy - YouTube Gallery
 * Handles loading and displaying YouTube videos
 */

let videos = [];

/**
 * Initialize YouTube gallery
 */
async function initYouTubeGallery() {
    // Only run on homepage
    const galleryContainer = document.getElementById('video-gallery');
    if (!galleryContainer) return;

    try {
        await loadVideos();
        renderVideoGallery();
    } catch (error) {
        console.error('Error initializing YouTube gallery:', error);
        showVideoError('Failed to load videos. Please try again later.');
    }
}

/**
 * Load videos from JSON file
 */
async function loadVideos() {
    try {
        const response = await fetch('data/videos.json');
        if (!response.ok) throw new Error('Failed to fetch videos');

        const data = await response.json();
        videos = data.videos || [];

        // Sort by date (newest first)
        videos.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading videos:', error);
        throw error;
    }
}

/**
 * Render video gallery on homepage
 */
function renderVideoGallery() {
    const container = document.getElementById('video-gallery');
    if (!container) return;

    // Show latest 6 videos
    const latestVideos = videos.slice(0, 6);

    if (latestVideos.length === 0) {
        container.innerHTML = '<p class="loading">No videos available yet.</p>';
        return;
    }

    container.innerHTML = latestVideos.map(video => createVideoCard(video)).join('');
}

/**
 * Create a video card HTML
 */
function createVideoCard(video) {
    const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

    return `
        <div class="video-card">
            <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">
                <img src="${thumbnailUrl}" alt="${video.title}">
                <h4>${video.title}</h4>
            </a>
        </div>
    `;
}

/**
 * Show error message
 */
function showVideoError(message) {
    const container = document.getElementById('video-gallery');
    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYouTubeGallery);
} else {
    initYouTubeGallery();
}
