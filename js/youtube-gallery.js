/**
 * Simply Nerdy - YouTube Gallery
 * Handles loading and displaying YouTube videos with caching
 * Uses YouTube Data API v3 for reliable video fetching
 */

(function() {
    'use strict';

    let videos = [];
    const CACHE_KEY = 'simply_nerdy_videos_cache';
    const CACHE_DURATION = 30 * 60 * 1000;

    const YOUTUBE_API_KEY = 'AIzaSyA2vZK7mrlIanWohdoLzqh15514fIgm9hI';
    const YOUTUBE_CHANNEL_ID = 'UC6H7mlCEADjPd-ivSQt8ozg';

    async function initYouTubeGallery() {
        const galleryContainer = document.getElementById('video-gallery');
        if (!galleryContainer) return;

        try {
            galleryContainer.innerHTML = '<p class="loading">Loading videos...</p>';

            await loadVideos();
            renderVideoGallery();
        } catch (error) {
            console.error('Error initializing YouTube gallery:', error);
            showVideoError('Failed to load videos. Please try again later.');
        }
    }

    function getCachedVideos() {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { videos: cachedVideos, timestamp } = JSON.parse(cached);
            const now = Date.now();

            if (now - timestamp < CACHE_DURATION) {
                console.log('Using cached videos (age: ' + Math.round((now - timestamp) / 1000 / 60) + ' minutes)');
                return cachedVideos;
            }

            console.log('Cache expired, fetching fresh videos');
            return null;
        } catch (error) {
            console.error('Error reading cache:', error);
            return null;
        }
    }

    function setCachedVideos(videoList) {
        try {
            const cacheData = {
                videos: videoList,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
            console.log('Videos cached successfully (' + videoList.length + ' videos)');
        } catch (error) {
            console.error('Error caching videos:', error);
        }
    }

    async function loadVideos() {
        const cachedVideos = getCachedVideos();
        if (cachedVideos && cachedVideos.length > 0) {
            videos = cachedVideos;
            return;
        }

        try {
            console.log('Fetching videos from YouTube Data API...');

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

            videos = data.items
                .filter(item => item.snippet.type === 'upload')
                .map(item => {
                    const videoId = item.contentDetails?.upload?.videoId;

                    return {
                        id: videoId,
                        title: item.snippet.title,
                        date: item.snippet.publishedAt,
                        description: item.snippet.description || '',
                        isShort: false
                    };
                })
                .filter(video => video.id);

            console.log(`Successfully loaded ${videos.length} videos from YouTube Data API`);

            setCachedVideos(videos);
            return;

        } catch (apiError) {
            console.error('YouTube Data API failed:', apiError);

            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { videos: cachedVideos } = JSON.parse(cached);
                    if (cachedVideos && cachedVideos.length > 0) {
                        console.log('Using expired cache as fallback (' + cachedVideos.length + ' videos)');
                        videos = cachedVideos;
                        return;
                    }
                }
            } catch (cacheError) {
                console.error('Error reading expired cache:', cacheError);
            }

            throw new Error('Unable to load videos from any source');
        }
    }

    function renderVideoGallery() {
        const container = document.getElementById('video-gallery');
        if (!container) return;

        const latestVideos = videos.slice(0, 6);

        if (latestVideos.length === 0) {
            container.innerHTML = '<p class="loading">No videos available yet.</p>';
            return;
        }

        container.innerHTML = latestVideos.map(video => createVideoCard(video)).join('');
        console.log('Rendered ' + latestVideos.length + ' videos');
    }

    function createVideoCard(video) {
        const safeId = escapeHtml(video.id);
        const safeTitle = escapeHtml(video.title);
        const thumbnailUrl = `https://img.youtube.com/vi/${safeId}/mqdefault.jpg`;
        const videoUrl = video.isShort
            ? `https://www.youtube.com/shorts/${safeId}`
            : `https://www.youtube.com/watch?v=${safeId}`;

        return `
            <div class="video-card">
                <a href="${videoUrl}" target="_blank" rel="noopener noreferrer">
                    <img src="${thumbnailUrl}" alt="${safeTitle}">
                    <h4>${safeTitle}</h4>
                </a>
            </div>
        `;
    }

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

    window.retryLoadVideos = async function() {
        const container = document.getElementById('video-gallery');
        if (container) {
            container.innerHTML = '<p class="loading">Loading videos...</p>';
        }

        try {
            console.log('Clearing cache and retrying...');
            localStorage.removeItem(CACHE_KEY);
            await loadVideos();
            renderVideoGallery();
        } catch (error) {
            console.error('Retry failed:', error);
            showVideoError('Still unable to load videos. Please try again later.');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initYouTubeGallery);
    } else {
        initYouTubeGallery();
    }

})();
