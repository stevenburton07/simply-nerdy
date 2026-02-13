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
 * Load videos from YouTube RSS feed
 */
async function loadVideos() {
    try {
        // Fetch from YouTube RSS feed
        const channelId = 'UC6H7mlCEADjPd-ivSQt8ozg';
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

        const response = await fetch(rssUrl);
        if (!response.ok) throw new Error('Failed to fetch videos from YouTube');

        const xmlText = await response.text();

        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Extract video data from RSS feed
        const entries = xmlDoc.querySelectorAll('entry');
        videos = Array.from(entries).map(entry => {
            const videoId = entry.querySelector('videoId')?.textContent;
            const title = entry.querySelector('title')?.textContent;
            const published = entry.querySelector('published')?.textContent;

            return {
                id: videoId,
                title: title,
                date: published,
                description: ''
            };
        });

        // Already sorted by date (newest first) from RSS feed
    } catch (error) {
        console.error('Error loading videos from YouTube:', error);

        // Fallback to JSON file if RSS fails
        try {
            console.log('Attempting to load from backup JSON file...');
            const fallbackResponse = await fetch('data/videos.json');
            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                videos = data.videos || [];
                videos.sort((a, b) => new Date(b.date) - new Date(a.date));
            }
        } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError);
            throw error;
        }
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
