/**
 * Simply Nerdy - YouTube Gallery
 * Handles loading and displaying YouTube videos with caching
 */

let videos = [];
const CACHE_KEY = 'simply_nerdy_videos_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

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
            console.log('Using cached videos');
            return cachedVideos;
        }

        // Cache expired
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
        console.log('Videos cached successfully');
    } catch (error) {
        console.error('Error caching videos:', error);
    }
}

/**
 * Fetch videos with timeout
 */
async function fetchWithTimeout(url, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Load videos from YouTube RSS feed
 */
async function loadVideos() {
    // Try to load from cache first
    const cachedVideos = getCachedVideos();
    if (cachedVideos && cachedVideos.length > 0) {
        videos = cachedVideos;
        return;
    }

    try {
        // Fetch from YouTube RSS feed via rss2json API
        const channelId = 'UC6H7mlCEADjPd-ivSQt8ozg';
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

        // Use rss2json API to convert RSS to JSON and bypass CORS
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        // Fetch with 10 second timeout
        const response = await fetchWithTimeout(apiUrl, 10000);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch videos`);
        }

        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            throw new Error('No videos found in feed');
        }

        // Extract video data from RSS feed
        videos = data.items.map(item => {
            // Extract video ID from the link
            // Handle both regular videos (youtube.com/watch?v=ID) and shorts (youtube.com/shorts/ID)
            let videoId;
            let isShort = false;

            if (item.link.includes('/shorts/')) {
                // Extract ID from shorts URL
                videoId = item.link.split('/shorts/')[1]?.split('?')[0];
                isShort = true;
            } else {
                // Extract ID from regular video URL
                videoId = item.link.split('v=')[1]?.split('&')[0];
            }

            return {
                id: videoId,
                title: item.title,
                date: item.pubDate,
                description: item.description || '',
                isShort: isShort
            };
        });

        console.log(`Successfully loaded ${videos.length} videos from YouTube`);

        // Cache the successful result
        setCachedVideos(videos);

    } catch (error) {
        console.error('Error loading videos from YouTube:', error);

        // Try to use any cache (even expired) as fallback
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const { videos: cachedVideos } = JSON.parse(cached);
                if (cachedVideos && cachedVideos.length > 0) {
                    console.log('Using expired cache as fallback');
                    videos = cachedVideos;
                    return;
                }
            }
        } catch (cacheError) {
            console.error('Error reading expired cache:', cacheError);
        }

        // Fallback to JSON file if RSS fails
        try {
            console.log('Attempting to load from backup JSON file...');
            const fallbackResponse = await fetchWithTimeout('data/videos.json', 5000);

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
    // Use the correct URL format based on whether it's a short or regular video
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
