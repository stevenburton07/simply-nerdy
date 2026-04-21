/**
 * Simply Nerdy - Articles Loader
 * Handles loading and rendering articles from JSON data
 */

(function() {
    'use strict';

    let blogPosts = [];
    let currentFilter = 'all';
    let currentSearchQuery = '';

    async function initBlog() {
        try {
            if (typeof generateSkeletonCards === 'function') {
                const previewContainer = document.getElementById('blog-preview');
                const archiveContainer = document.getElementById('blog-posts');
                if (previewContainer) previewContainer.innerHTML = generateSkeletonCards(3);
                if (archiveContainer) archiveContainer.innerHTML = generateSkeletonCards(6);
            }

            await loadBlogPosts();

            const path = window.location.pathname;

            if (path.includes('articles.html')) {
                renderBlogArchive();
                setupFilterButtons();
                setupSearch();
            } else if (path.includes('article.html')) {
                renderBlogPost();
            } else if (path.includes('index.html') || path.endsWith('/')) {
                renderBlogPreview();
            }
        } catch (error) {
            console.error('Error initializing blog:', error);
            showError('Failed to load articles. Please try again later.');
        }
    }

    async function loadBlogPosts() {
        try {
            const response = await fetch('data/articles.json');
            if (!response.ok) throw new Error('Failed to fetch blog posts');

            const data = await response.json();
            blogPosts = data.posts || [];

            blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error loading blog posts:', error);
            throw error;
        }
    }

    function renderBlogPreview() {
        const container = document.getElementById('blog-preview');
        if (!container) return;

        const latestPosts = blogPosts.slice(0, 3);

        if (latestPosts.length === 0) {
            container.innerHTML = '<p class="loading">No articles available yet.</p>';
            return;
        }

        container.innerHTML = latestPosts.map(post => createPostCard(post)).join('');
    }

    function renderBlogArchive() {
        const container = document.getElementById('blog-posts');
        const noPostsDiv = document.getElementById('no-posts');

        if (!container) return;

        let filteredPosts = filterPosts(currentFilter);

        if (currentSearchQuery) {
            filteredPosts = searchPosts(filteredPosts, currentSearchQuery);
        }

        if (filteredPosts.length === 0) {
            container.innerHTML = '';
            if (noPostsDiv) {
                noPostsDiv.style.display = 'block';
                noPostsDiv.querySelector('p').textContent = currentSearchQuery
                    ? 'No posts found matching your search.'
                    : 'No posts found in this category.';
            }
            return;
        }

        if (noPostsDiv) noPostsDiv.style.display = 'none';
        container.innerHTML = filteredPosts.map(post => createPostCard(post)).join('');
    }

    function filterPosts(category) {
        if (category === 'all') return blogPosts;

        return blogPosts.filter(post =>
            post.category === category || post.tags.includes(category)
        );
    }

    function searchPosts(posts, query) {
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) return posts;

        return posts.filter(post => {
            const titleMatch = post.title.toLowerCase().includes(lowerQuery);
            const excerptMatch = post.excerpt.toLowerCase().includes(lowerQuery);
            const contentMatch = post.content.toLowerCase().includes(lowerQuery);
            const tagsMatch = post.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
            const categoryMatch = post.category.toLowerCase().includes(lowerQuery);

            return titleMatch || excerptMatch || contentMatch || tagsMatch || categoryMatch;
        });
    }

    function setupSearch() {
        const searchInput = document.getElementById('blog-search');

        if (!searchInput) return;

        const debouncedSearch = debounce((value) => {
            currentSearchQuery = value;
            renderBlogArchive();
        }, 250);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
    }

    function setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                currentFilter = button.dataset.category;
                renderBlogArchive();
            });
        });
    }

    function createPostCard(post) {
        const formattedDate = formatDate(post.date);
        const safeId = escapeHtml(post.id);
        const safeTitle = escapeHtml(post.title);
        const safeImage = escapeHtml(post.image);
        const safeCategory = escapeHtml(post.category);
        const safeExcerpt = escapeHtml(post.excerpt);

        return `
            <article class="post-card">
                <a href="article.html?id=${safeId}" class="post-card-link-wrapper">
                    <img src="${safeImage}" alt="${safeTitle}" class="post-card-image">
                    <div class="post-card-content">
                        <div class="post-card-meta">
                            <span class="post-card-category">${safeCategory}</span>
                            <span class="post-card-date">${formattedDate}</span>
                        </div>
                        <h3>${safeTitle}</h3>
                        <p class="post-card-excerpt">${safeExcerpt}</p>
                        <span class="post-card-link">
                            Read More →
                        </span>
                    </div>
                </a>
            </article>
        `;
    }

    function renderBlogPost() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');

        if (!postId) {
            showError('Article not found.');
            return;
        }

        const post = blogPosts.find(p => p.id === postId);

        if (!post) {
            showError('Article not found.');
            return;
        }

        document.title = `${post.title} | Simply Nerdy`;
        document.getElementById('page-title').textContent = `${post.title} | Simply Nerdy`;

        const ogTitle = document.getElementById('og-title');
        const ogDescription = document.getElementById('og-description');
        if (ogTitle) ogTitle.setAttribute('content', post.title);
        if (ogDescription) ogDescription.setAttribute('content', post.excerpt);

        document.getElementById('post-category').textContent = post.category;
        document.getElementById('post-date').textContent = formatDate(post.date);
        document.getElementById('post-author').textContent = `By ${post.author}`;
        document.getElementById('post-title').textContent = post.title;
        document.getElementById('post-excerpt').textContent = post.excerpt;

        const featuredImage = document.getElementById('post-featured-image');
        featuredImage.src = post.image;
        featuredImage.alt = post.title;

        document.getElementById('post-content').innerHTML = post.content;

        const tagsContainer = document.getElementById('post-tags');
        tagsContainer.innerHTML = post.tags.map(tag =>
            `<span class="tag">${escapeHtml(tag)}</span>`
        ).join('');

        renderRelatedPosts(post);
    }

    function renderRelatedPosts(currentPost) {
        const container = document.getElementById('related-posts-list');
        if (!container) return;

        const relatedPosts = blogPosts
            .filter(post => post.id !== currentPost.id)
            .filter(post =>
                post.category === currentPost.category ||
                post.tags.some(tag => currentPost.tags.includes(tag))
            )
            .slice(0, 3);

        if (relatedPosts.length === 0) {
            document.getElementById('related-posts').style.display = 'none';
            return;
        }

        container.innerHTML = relatedPosts.map(post => `
            <div class="related-post">
                <a href="article.html?id=${escapeHtml(post.id)}">
                    <div class="related-post-title">${escapeHtml(post.title)}</div>
                    <div class="related-post-date">${formatDate(post.date)}</div>
                </a>
            </div>
        `).join('');
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    function showError(message) {
        const container = document.getElementById('blog-posts') ||
                          document.getElementById('blog-preview') ||
                          document.querySelector('.post-main');

        if (container) {
            const div = document.createElement('div');
            div.className = 'error';
            div.textContent = message;
            container.innerHTML = '';
            container.appendChild(div);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBlog);
    } else {
        initBlog();
    }

})();
