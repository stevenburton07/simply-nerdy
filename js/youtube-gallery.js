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
        // Fetch from YouTube RSS feed via rss2json API
        const channelId = 'UC6H7mlCEADjPd-ivSQt8ozg';
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

        // Use rss2json API to convert RSS to JSON and bypass CORS
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Failed to fetch videos from YouTube');

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            throw new Error('No videos found in feed');
        }

        // Extract video data from RSS feed
        videos = data.items.map(item => {
            // Extract video ID from the link
            const videoId = item.link.split('v=')[1]?.split('&')[0];

            return {
                id: videoId,
                title: item.title,
                date: item.pubDate,
                description: item.description || ''
            };
        });

        console.log(`Successfully loaded ${videos.length} videos from YouTube`);
    } catch (error) {
        console.error('Error loading videos from YouTube:', error);

        // Fallback to JSON file if RSS fails
        try {
            console.log('Attempting to load from backup JSON file...');
            const fallbackResponse = await fetch('data/videos.json');
            if (fallbackResponse.ok) {
                const data = await fallbackResponse.json();
                videos = data.videos || [];

                if (videos.length === 0) {
                    throw new Error('No videos in backup JSON either');
                }

                videos.sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log(`Loaded ${videos.length} videos from backup JSON`);
            } else {
                throw new Error('Backup JSON file not found');
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
