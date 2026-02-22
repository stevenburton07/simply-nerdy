/**
 * Simply Nerdy - YouTube Gallery
 * Handles loading and displaying YouTube videos with caching
 * Uses YouTube Data API v3 for reliable video fetching
 */

let videos = [];
const CACHE_KEY = 'simply_nerdy_videos_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// YouTube Data API Configuration
// Get your API key from: https://console.cloud.google.com/apis/credentials
const YOUTUBE_API_KEY = 'AIzaSyBebc4vg4j4xAc4YcENkPGIMFWmPnySBHM';
const YOUTUBE_CHANNEL_ID = 'UC6H7mlCEADjPd-ivSQt8ozg';

/**
 * Initialize YouTube gallery
 */
async function initYouTubeGallery() {
    // Only run on homepage
    const galleryContainer = document.getElementById('video-gallery');
    if (!galleryContainer) return;

    try {
        // Show loading state
        galleryContainer.innerHTML = '<p class="loading">Loading videos...</p>';

        await loadVideos();
        renderVideoGallery();
    } catch (error) {
        console.error('Error initializing YouTube gallery:', error);
        showVideoError('Failed to load videos. Please try again later.');
    }
}

/**
 * Get cached videos from localStorage
 */
function getCachedVideos() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const { videos: cachedVideos, timestamp } = JSON.parse(cached);
        const now = Date.now();

        // Check if cache is still valid
        if (now - timestamp < CACHE_DURATION) {
            console.log('Using cached videos (age: ' + Math.round((now - timestamp) / 1000 / 60) + ' minutes)');
            return cachedVideos;
        }

        // Cache expired but keep it as backup
        console.log('Cache expired, fetching fresh videos');
        return null;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
}

/**
 * Save videos to localStorage cache
 */
function setCachedVideos(videos) {
    try {
        const cacheData = {
            videos: videos,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        console.log('Videos cached successfully (' + videos.length + ' videos)');
    } catch (error) {
        console.error('Error caching videos:', error);
    }
}

/**
 * Load videos from YouTube Data API v3
 */
async function loadVideos() {
    // Try to load from cache first
    const cachedVideos = getCachedVideos();
    if (cachedVideos && cachedVideos.length > 0) {
        videos = cachedVideos;
        return;
    }

    // Try YouTube Data API first (most reliable)
    if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY_HERE') {
        try {
            console.log('Fetching videos from YouTube Data API...');

            // Use activities endpoint to get both videos and shorts
            const apiUrl = `https://www.googleapis.com/youtube/v3/activities?part=snippet,contentDetails&channelId=${YOUTUBE_CHANNEL_ID}&maxResults=10&key=${YOUTUBE_API_KEY}`;

            const response = await fetch(apiUrl);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('YouTube API error:', errorData);
                throw new Error(`YouTube API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('YouTube API response:', data);

            if (!data.items || data.items.length === 0) {
                throw new Error('No videos found from YouTube API');
            }

            // Extract video data from API response
            videos = data.items
                .filter(item => item.snippet.type === 'upload') // Only uploaded videos
                .map(item => {
                    const videoId = item.contentDetails?.upload?.videoId;

                    return {
                        id: videoId,
                        title: item.snippet.title,
                        date: item.snippet.publishedAt,
                        description: item.snippet.description || '',
                        isShort: false // YouTube API doesn't distinguish, but we can detect later
                    };
                })
                .filter(video => video.id); // Remove any without IDs

            console.log(`Successfully loaded ${videos.length} videos from YouTube Data API`);

            // Cache the successful result
            setCachedVideos(videos);
            return;

        } catch (apiError) {
            console.error('YouTube Data API failed:', apiError);
            // Continue to fallback options
        }
    } else {
        console.warn('YouTube API key not configured, using fallback methods');
    }

    // Fallback 1: Try backup JSON file
    try {
        console.log('Loading videos from backup JSON...');
        const fallbackResponse = await fetch('data/videos.json');

        if (fallbackResponse.ok) {
            const data = await fallbackResponse.json();
            videos = data.videos || [];

            if (videos.length > 0) {
                videos.sort((a, b) => new Date(b.date) - new Date(a.date));
                console.log(`Loaded ${videos.length} videos from backup JSON`);
                setCachedVideos(videos);
                return;
            }
        }
    } catch (jsonError) {
        console.warn('Backup JSON failed:', jsonError);
    }

    // Fallback 2: Try expired cache
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { videos: cachedVideos } = JSON.parse(cached);
            if (cachedVideos && cachedVideos.length > 0) {
                console.log('Using expired cache as last resort (' + cachedVideos.length + ' videos)');
                videos = cachedVideos;
                return;
            }
        }
    } catch (cacheError) {
        console.error('Error reading expired cache:', cacheError);
    }

    // If we get here, everything failed
    throw new Error('Unable to load videos from any source');
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
    console.log('Rendered ' + latestVideos.length + ' videos');
}

/**
 * Create a video card HTML
 */
function createVideoCard(video) {
    const thumbnailUrl = `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;
    const videoUrl = video.isShort
        ? `https://www.youtube.com/shorts/${video.id}`
        : `https://www.youtube.com/watch?v=${video.id}`;

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
 * Show error message with retry button
 */
function showVideoError(message) {
    const container = document.getElementById('video-gallery');
    if (container) {
        container.innerHTML = `
            <div class="error-message" style="text-align: center; padding: 2rem;">
                <p style="color: var(--neutral-700); margin-bottom: 1rem;">${message}</p>
                <button onclick="retryLoadVideos()" class="btn btn-primary btn-sm">Retry</button>
            </div>
        `;
    }
}

/**
 * Retry loading videos (exposed globally for button onclick)
 */
window.retryLoadVideos = async function() {
    const container = document.getElementById('video-gallery');
    if (container) {
        container.innerHTML = '<p class="loading">Loading videos...</p>';
    }

    try {
        // Clear cache to force fresh fetch
        console.log('Clearing cache and retrying...');
        localStorage.removeItem(CACHE_KEY);
        await loadVideos();
        renderVideoGallery();
    } catch (error) {
        console.error('Retry failed:', error);
        showVideoError('Still unable to load videos. Please try again later.');
    }
}

// Initialize gallery when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initYouTubeGallery);
} else {
    initYouTubeGallery();
}
