/**
 * Simply Nerdy - Animations
 * Scroll-reveal, hero parallax, typing effect, skeleton loading, stat counters
 */

function generateSkeletonCards(count) {
    var html = '';
    for (var i = 0; i < count; i++) {
        html += '<div class="skeleton-card">' +
            '<div class="skeleton skeleton-image"></div>' +
            '<div class="skeleton-body">' +
                '<div class="skeleton skeleton-line skeleton-line--title"></div>' +
                '<div class="skeleton skeleton-line skeleton-line--medium"></div>' +
                '<div class="skeleton skeleton-line skeleton-line--short"></div>' +
            '</div>' +
        '</div>';
    }
    return html;
}

(function() {
    'use strict';

    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function init() {
        initScrollReveal();
        initHeroParallax();
        initStatCounter();
    }

    // ================================
    // Scroll Reveal
    // ================================

    function initScrollReveal() {
        var selectors = [
            '.video-card', '.post-card', '.suggestion-card',
            '.topic-card', '.sidebar-card', '.section-header',
            '.genre-list-item', '.cta-box',
            '.post-content h2', '.post-content h3',
            '.about-main h2', '.about-main h3'
        ].join(', ');

        function applyReveal(root) {
            var elements = root.querySelectorAll(selectors);
            elements.forEach(function(el) {
                if (el.classList.contains('reveal')) return;
                el.classList.add('reveal');

                if (prefersReducedMotion) {
                    el.classList.add('revealed');
                } else {
                    observer.observe(el);
                }
            });
        }

        if (prefersReducedMotion) {
            applyReveal(document);
            watchDynamicContainers(applyReveal);
            return;
        }

        var observer = new IntersectionObserver(function(entries) {
            var groups = {};

            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                var parent = entry.target.parentElement;
                var key = parent ? (parent.id || parent.className) : '_root';
                if (!groups[key]) groups[key] = [];
                groups[key].push(entry.target);
            });

            Object.keys(groups).forEach(function(key) {
                groups[key].forEach(function(el, i) {
                    el.style.transitionDelay = (i * 80) + 'ms';
                    el.classList.add('revealed');
                    observer.unobserve(el);
                });
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        applyReveal(document);
        watchDynamicContainers(applyReveal);
    }

    function watchDynamicContainers(callback) {
        var ids = ['video-gallery', 'blog-preview', 'blog-posts', 'suggestions-view'];
        var mutationObserver = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length > 0) {
                    callback(mutation.target);
                }
            });
        });

        ids.forEach(function(id) {
            var container = document.getElementById(id);
            if (container) {
                mutationObserver.observe(container, { childList: true, subtree: true });
            }
        });
    }

    // ================================
    // Hero Parallax
    // ================================

    function initHeroParallax() {
        if (prefersReducedMotion) return;

        var isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
        if (isTouchDevice) return;

        var heroes = document.querySelectorAll('.hero, .page-hero');
        if (heroes.length === 0) return;

        var ticking = false;

        function updateParallax() {
            var scrollY = window.pageYOffset;
            heroes.forEach(function(hero) {
                var rect = hero.getBoundingClientRect();
                if (rect.bottom < 0) return;
                var offset = scrollY * 0.3;
                hero.style.backgroundPositionY = offset + 'px';
            });
            ticking = false;
        }

        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        }, { passive: true });
    }


    // ================================
    // Stat Counter (about page)
    // ================================

    function initStatCounter() {
        var statElements = document.querySelectorAll('.stat-number');
        if (statElements.length === 0) return;

        statElements.forEach(function(el) {
            var target = parseInt(el.textContent.replace(/,/g, ''), 10);
            if (isNaN(target)) return;
            el.setAttribute('data-target', target);

            if (prefersReducedMotion) return;
            el.textContent = '0';
        });

        if (prefersReducedMotion) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.5 });

        statElements.forEach(function(el) {
            observer.observe(el);
        });
    }

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-target'), 10);
        var duration = 1500;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var elapsed = timestamp - startTime;
            var t = Math.min(elapsed / duration, 1);
            var eased = t * (2 - t);
            var current = Math.floor(eased * target);
            el.textContent = formatNumber(current);

            if (t < 1) {
                requestAnimationFrame(step);
            } else {
                el.textContent = formatNumber(target);
            }
        }

        requestAnimationFrame(step);
    }

    // ================================
    // Init
    // ================================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
