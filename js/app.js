/**
 * Simply Nerdy - Main Application
 * Handles global app initialization and interactions
 */

(function() {
    'use strict';

    /**
     * Initialize the application
     */
    function init() {
        setupMobileNavigation();
        setupSmoothScrolling();
        highlightActiveNavLink();
    }

    /**
     * Setup mobile navigation hamburger menu
     */
    function setupMobileNavigation() {
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');

        if (!hamburger || !navLinks) return;

        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');

            // Animate hamburger icon
            const spans = hamburger.querySelectorAll('span');
            if (hamburger.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');

                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close mobile menu when clicking a nav link
        const navLinkItems = navLinks.querySelectorAll('a');
        navLinkItems.forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');

                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    /**
     * Setup smooth scrolling for anchor links
     */
    function setupSmoothScrolling() {
        const anchorLinks = document.querySelectorAll('a[href^="#"]');

        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href').substring(1);
                if (!targetId) return;

                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    /**
     * Highlight active navigation link based on current page
     */
    function highlightActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-links a');

        navLinks.forEach(link => {
            const linkPath = link.getAttribute('href');

            // Skip external links (those starting with http)
            if (linkPath && linkPath.startsWith('http')) {
                return;
            }

            // Check if this is the home page
            const isHomePage = currentPath === '/' ||
                             currentPath === '/index.html' ||
                             currentPath.endsWith('/index.html');

            // Check if this link should be active
            const shouldBeActive =
                linkPath === currentPath ||
                (isHomePage && linkPath === 'index.html') ||
                (currentPath.includes(linkPath) && linkPath !== 'index.html' && linkPath !== '/');

            if (shouldBeActive) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Add scroll effect to header on scroll
     */
    function setupHeaderScroll() {
        const header = document.querySelector('.site-header');
        if (!header) return;

        let lastScroll = 0;

        const handleScroll = throttle(() => {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 100) {
                header.style.boxShadow = 'var(--shadow-md)';
            } else {
                header.style.boxShadow = 'var(--shadow-sm)';
            }

            lastScroll = currentScroll;
        }, 100);

        window.addEventListener('scroll', handleScroll);
    }

    /**
     * Initialize animations on scroll
     */
    function initScrollAnimations() {
        const animateOnScroll = document.querySelectorAll('[data-animate]');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animateOnScroll.forEach(el => observer.observe(el));
    }

    /**
     * Handle external links
     */
    function setupExternalLinks() {
        const externalLinks = document.querySelectorAll('a[href^="http"]');

        externalLinks.forEach(link => {
            // Add visual indicator for external links
            if (!link.hostname.includes(window.location.hostname)) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // Initialize app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Additional initialization after page load
    window.addEventListener('load', () => {
        setupHeaderScroll();
        setupExternalLinks();
    });

})();
