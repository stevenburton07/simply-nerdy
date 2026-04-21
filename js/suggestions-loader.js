/**
 * Simply Nerdy - Suggestions Loader
 * Two-step flow: genre tiles -> suggestion cards within a genre
 */

(function() {
    'use strict';

    let suggestions = [];
    let selectedGenre = null;
    let currentCategory = 'all';
    let currentSearchQuery = '';

    async function initSuggestions() {
        try {
            await loadSuggestions();

            const params = new URLSearchParams(window.location.search);
            const genre = params.get('genre');

            if (genre && suggestions.some(s => s.genre === genre)) {
                selectedGenre = genre;
                renderCards();
            } else {
                renderGenres();
            }
        } catch (error) {
            console.error('Error initializing suggestions:', error);
            showError('Failed to load suggestions. Please try again later.');
        }
    }

    async function loadSuggestions() {
        const response = await fetch('data/suggestions.json');
        if (!response.ok) throw new Error('Failed to fetch suggestions');

        const data = await response.json();
        suggestions = data.suggestions || [];
    }

    function getGenres() {
        const genreMap = {};
        suggestions.forEach(s => {
            if (!genreMap[s.genre]) {
                genreMap[s.genre] = { name: s.genre, count: 0, image: null };
            }
            genreMap[s.genre].count++;
            if (!genreMap[s.genre].image) {
                genreMap[s.genre].image = s.image;
            }
        });
        return Object.values(genreMap).sort((a, b) => a.name.localeCompare(b.name));
    }

    function renderGenres() {
        const container = document.getElementById('suggestions-view');
        const noResultsDiv = document.getElementById('no-suggestions');
        if (!container) return;

        selectedGenre = null;
        if (noResultsDiv) noResultsDiv.style.display = 'none';

        const genres = getGenres();

        if (genres.length === 0) {
            container.innerHTML = '';
            if (noResultsDiv) {
                noResultsDiv.style.display = 'block';
                noResultsDiv.querySelector('p').textContent = 'No suggestions available yet.';
            }
            return;
        }

        const items = genres.map(genre => {
            const safeName = escapeHtml(genre.name);
            const countLabel = genre.count === 1 ? '1 title' : genre.count + ' titles';

            return `<button class="genre-list-item" data-genre="${safeName}"><span class="genre-list-name">${safeName}</span><span class="genre-list-count">${countLabel}</span></button>`;
        }).join('');

        container.innerHTML = '<h2 class="genre-list-heading">Choose a Genre</h2><div class="genre-list">' + items + '</div>';

        container.querySelectorAll('.genre-list-item').forEach(item => {
            item.addEventListener('click', () => {
                window.location.href = 'suggestions.html?genre=' + encodeURIComponent(item.dataset.genre);
            });
        });
    }

    function getFilteredCards() {
        let filtered = suggestions.filter(s => s.genre === selectedGenre);

        if (currentCategory !== 'all') {
            filtered = filtered.filter(s => s.category === currentCategory);
        }

        if (currentSearchQuery) {
            const q = currentSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(s =>
                s.title.toLowerCase().includes(q) ||
                s.excerpt.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q) ||
                s.tags.some(t => t.toLowerCase().includes(q))
            );
        }

        return filtered;
    }

    function renderCards() {
        const container = document.getElementById('suggestions-view');
        const noResultsDiv = document.getElementById('no-suggestions');
        if (!container) return;

        const filtered = getFilteredCards();
        const safeGenre = escapeHtml(selectedGenre);

        const backButton = `
            <div class="suggestions-back-bar">
                <button class="suggestions-back-btn" id="back-to-genres">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
                    All Genres
                </button>
                <h2 class="suggestions-genre-title">${safeGenre}</h2>
            </div>
        `;

        const searchValue = escapeHtml(currentSearchQuery);
        const categories = ['all', 'Games', 'Books', 'Movies', 'TV Shows', 'Music'];
        const filterBar = `
            <div class="suggestions-filter-bar">
                <div class="search-bar">
                    <input type="text" id="suggestions-search" placeholder="Search in ${safeGenre}..." class="search-input" value="${searchValue}">
                </div>
                <div class="filter-buttons">
                    ${categories.map(c => {
                        const label = c === 'all' ? 'All' : escapeHtml(c);
                        const active = c === currentCategory ? ' active' : '';
                        return '<button class="filter-btn' + active + '" data-category="' + escapeHtml(c) + '">' + label + '</button>';
                    }).join('')}
                </div>
            </div>
        `;

        if (filtered.length === 0) {
            const msg = currentSearchQuery
                ? 'No suggestions found matching your search.'
                : 'No suggestions found in this category.';
            container.innerHTML = backButton + filterBar + '<div class="no-posts"><p>' + escapeHtml(msg) + '</p></div>';
            if (noResultsDiv) noResultsDiv.style.display = 'none';
        } else {
            if (noResultsDiv) noResultsDiv.style.display = 'none';
            const cards = filtered.map(createSuggestionCard).join('');
            container.innerHTML = backButton + filterBar + '<div class="blog-grid">' + cards + '</div>';
        }

        document.getElementById('back-to-genres').addEventListener('click', () => {
            currentCategory = 'all';
            currentSearchQuery = '';
            renderGenres();
        });

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                currentCategory = btn.dataset.category;
                renderCards();
            });
        });

        const searchInput = document.getElementById('suggestions-search');
        if (searchInput) {
            searchInput.focus();
            searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);

            const debouncedSearch = debounce((value) => {
                currentSearchQuery = value;
                renderCards();
            }, 250);

            searchInput.addEventListener('input', (e) => {
                debouncedSearch(e.target.value);
            });
        }
    }

    function createSuggestionCard(suggestion) {
        const safeTitle = escapeHtml(suggestion.title);
        const safeImage = escapeHtml(suggestion.image);
        const safeCategory = escapeHtml(suggestion.category);
        const safeExcerpt = escapeHtml(suggestion.excerpt);

        const platformLinks = suggestion.platforms.map(p => {
            const safeUrl = escapeHtml(p.url);
            const safeName = escapeHtml(p.name);
            const icon = getPlatformIcon(p.icon);

            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="platform-link" title="${safeName}">${icon}<span class="platform-name">${safeName}</span></a>`;
        }).join('');

        return `
            <article class="post-card suggestion-card">
                <div class="post-card-link-wrapper">
                    <img src="${safeImage}" alt="${safeTitle}" class="post-card-image">
                    <div class="post-card-content">
                        <div class="post-card-meta">
                            <span class="post-card-category">${safeCategory}</span>
                        </div>
                        <h3>${safeTitle}</h3>
                        <p class="post-card-excerpt">${safeExcerpt}</p>
                        <div class="suggestion-card-platforms">
                            <span class="platforms-label">Available on:</span>
                            <div class="platform-links">${platformLinks}</div>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    function showError(message) {
        const container = document.getElementById('suggestions-view');
        if (container) {
            const div = document.createElement('div');
            div.className = 'error';
            div.textContent = message;
            container.innerHTML = '';
            container.appendChild(div);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSuggestions);
    } else {
        initSuggestions();
    }

})();
