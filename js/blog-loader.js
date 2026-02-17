/**
 * Simply Nerdy - Blog Loader
 * Handles loading and rendering blog posts from JSON data
 */

let blogPosts = [];
let currentFilter = 'all';
let currentSearchQuery = '';

/**
 * Initialize blog functionality
 */
async function initBlog() {
    try {
        await loadBlogPosts();

        // Determine which page we're on
        const path = window.location.pathname;

        if (path.includes('blog.html')) {
            renderBlogArchive();
            setupFilterButtons();
            setupSearch();
        } else if (path.includes('blog-post.html')) {
            renderBlogPost();
        } else if (path.includes('index.html') || path.endsWith('/')) {
            renderBlogPreview();
        }
    } catch (error) {
        console.error('Error initializing blog:', error);
        showError('Failed to load blog posts. Please try again later.');
    }
}

/**
 * Load blog posts from JSON file
 */
async function loadBlogPosts() {
    try {
        const response = await fetch('data/blog-posts.json');
        if (!response.ok) throw new Error('Failed to fetch blog posts');

        const data = await response.json();
        blogPosts = data.posts || [];

        // Sort by date (newest first)
        blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading blog posts:', error);
        throw error;
    }
}

/**
 * Render blog preview on homepage (latest 3 posts)
 */
function renderBlogPreview() {
    const container = document.getElementById('blog-preview');
    if (!container) return;

    const latestPosts = blogPosts.slice(0, 3);

    if (latestPosts.length === 0) {
        container.innerHTML = '<p class="loading">No blog posts available yet.</p>';
        return;
    }

    container.innerHTML = latestPosts.map(post => createPostCard(post)).join('');
}

/**
 * Render all blog posts on archive page
 */
function renderBlogArchive() {
    const container = document.getElementById('blog-posts');
    const noPostsDiv = document.getElementById('no-posts');

    if (!container) return;

    let filteredPosts = filterPosts(currentFilter);

    // Apply search filter if there's a search query
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

/**
 * Filter posts by category
 */
function filterPosts(category) {
    if (category === 'all') return blogPosts;

    return blogPosts.filter(post =>
        post.category === category || post.tags.includes(category)
    );
}

/**
 * Search posts by query
 */
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

/**
 * Setup search functionality
 */
function setupSearch() {
    const searchInput = document.getElementById('blog-search');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderBlogArchive();
    });
}

/**
 * Setup filter button functionality
 */
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Update filter and re-render
            currentFilter = button.dataset.category;
            renderBlogArchive();
        });
    });
}

/**
 * Create a blog post card HTML
 */
function createPostCard(post) {
    const formattedDate = formatDate(post.date);

    return `
        <article class="post-card">
            <a href="blog-post.html?id=${post.id}" class="post-card-link-wrapper">
                <img src="${post.image}" alt="${post.title}" class="post-card-image">
                <div class="post-card-content">
                    <div class="post-card-meta">
                        <span class="post-card-category">${post.category}</span>
                        <span class="post-card-date">${formattedDate}</span>
                    </div>
                    <h3>${post.title}</h3>
                    <p class="post-card-excerpt">${post.excerpt}</p>
                    <span class="post-card-link">
                        Read More →
                    </span>
                </div>
            </a>
        </article>
    `;
}

/**
 * Render individual blog post page
 */
function renderBlogPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        showError('Blog post not found.');
        return;
    }

    const post = blogPosts.find(p => p.id === postId);

    if (!post) {
        showError('Blog post not found.');
        return;
    }

    // Update page title and meta
    document.title = `${post.title} | Simply Nerdy`;
    document.getElementById('page-title').textContent = `${post.title} | Simply Nerdy`;

    // Set Open Graph meta tags
    const ogTitle = document.getElementById('og-title');
    const ogDescription = document.getElementById('og-description');
    if (ogTitle) ogTitle.setAttribute('content', post.title);
    if (ogDescription) ogDescription.setAttribute('content', post.excerpt);

    // Populate post content
    document.getElementById('post-category').textContent = post.category;
    document.getElementById('post-date').textContent = formatDate(post.date);
    document.getElementById('post-title').textContent = post.title;
    document.getElementById('post-excerpt').textContent = post.excerpt;

    const featuredImage = document.getElementById('post-featured-image');
    featuredImage.src = post.image;
    featuredImage.alt = post.title;

    document.getElementById('post-content').innerHTML = post.content;

    // Render tags
    const tagsContainer = document.getElementById('post-tags');
    tagsContainer.innerHTML = post.tags.map(tag =>
        `<span class="tag">${tag}</span>`
    ).join('');

    // Render related posts
    renderRelatedPosts(post);
}

/**
 * Render related posts in sidebar
 */
function renderRelatedPosts(currentPost) {
    const container = document.getElementById('related-posts-list');
    if (!container) return;

    // Find posts with matching category or tags
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
            <a href="blog-post.html?id=${post.id}">
                <div class="related-post-title">${post.title}</div>
                <div class="related-post-date">${formatDate(post.date)}</div>
            </a>
        </div>
    `).join('');
}

/**
 * Format date string
 */
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('blog-posts') ||
                      document.getElementById('blog-preview') ||
                      document.querySelector('.post-main');

    if (container) {
        container.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Initialize blog when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}
