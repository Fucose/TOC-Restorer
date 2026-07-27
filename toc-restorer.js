// ==UserScript==
// @name         ACS & RSC ASAP TOC Restorer
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Restores TOC / Visual Abstract graphics on ACS and RSC ASAP pages using light Silverchair AJAX API (~2KB payload) with full-page fallback.
// @author       Yingjie Wang @SIOC
// @match        https://pubs.acs.org/*
// @match        https://pubs.rsc.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Inject CSS styles: Flat UI layout, clickable link styles, & CSS spinner animation
    const style = document.createElement('style');
    style.textContent = `
        .custom-toc-wrapper {
            margin: 12px 0 8px 0;
            padding: 8px 12px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            display: inline-block;
            max-width: 100%;
        }
        .custom-toc-link {
            display: inline-block;
            text-decoration: none;
            outline: none;
            cursor: pointer;
        }
        .custom-toc-img {
            max-height: 220px;
            max-width: 100%;
            object-fit: contain;
            display: block;
            border-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .custom-toc-link:hover .custom-toc-img {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .custom-toc-loading {
            font-size: 12px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .custom-toc-spinner {
            width: 13px;
            height: 13px;
            border: 2px solid #cbd5e1;
            border-top-color: #0284c7;
            border-radius: 50%;
            animation: custom-toc-spin 0.75s linear infinite;
            display: inline-block;
            box-sizing: border-box;
        }
        @keyframes custom-toc-spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    const parser = new DOMParser();

    // 2. IntersectionObserver for lazy loading
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const card = entry.target;
                obs.unobserve(card);
                fetchAndRenderTOC(card);
            }
        });
    }, { rootMargin: '300px' });

    // 3. Scan and observe article cards
    function scanAndObserve() {
        const cards = document.querySelectorAll('.al-article-items');
        cards.forEach(card => {
            if (!card.dataset.tocProcessed) {
                card.dataset.tocProcessed = 'true';
                observer.observe(card);
            }
        });
    }

    // Helper: Helper function to extract TOC image URL from parsed HTML DOM
    function extractImageSrc(doc) {
        const imgCandidates = doc.querySelectorAll('.graphical-abstract img, .fig-graphic img, .graphicalAbstract img');
        for (const imgNode of imgCandidates) {
            const candidate = imgNode.getAttribute('data-src') || imgNode.getAttribute('src');
            if (candidate && !candidate.includes('preloader.gif') && !candidate.includes('/Themes/')) {
                return candidate.startsWith('/') ? window.location.origin + candidate : candidate;
            }
        }
        return null;
    }

    // 4. Main fetching function: Primary AJAX API -> Fallback to Full Article Page
    async function fetchAndRenderTOC(card) {
        const titleLink = card.querySelector('.al-title a');
        if (!titleLink) return;

        // Extract article ID and journal code prefix (e.g. "orlef7" or "sc")
        const articleId = card.dataset.articleId || card.querySelector('[data-articleid]')?.dataset.articleid;
        const pathSegments = titleLink.pathname.split('/').filter(Boolean);
        const journalCode = pathSegments[0];

        // Create container and flat loading UI
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-toc-wrapper';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'custom-toc-loading';
        loadingDiv.innerHTML = `<span class="custom-toc-spinner"></span> Loading TOC Graphic...`;
        wrapper.appendChild(loadingDiv);

        // Insert above the badge/resource link bar
        const badgeBar = card.querySelector('.badge-bar');
        if (badgeBar) {
            card.insertBefore(wrapper, badgeBar);
        } else {
            card.appendChild(wrapper);
        }

        try {
            let imgSrc = null;

            // Strategy 1: High-Performance Lightweight AJAX API (~2KB)
            if (articleId && journalCode) {
                const ajaxEndpoint = `/${journalCode}/PlatformArticle/ArticleAbstractAjax?articleId=${articleId}&layAbstract=false`;
                try {
                    const res = await fetch(ajaxEndpoint, {
                        headers: { 'X-Requested-With': 'XMLHttpRequest' }
                    });
                    if (res.ok) {
                        const json = await res.json();
                        if (json.Success && json.Html) {
                            const doc = parser.parseFromString(json.Html, 'text/html');
                            imgSrc = extractImageSrc(doc);
                        }
                    }
                } catch (apiErr) {
                    console.warn('AJAX Endpoint failed, switching to full-page fallback:', apiErr);
                }
            }

            // Strategy 2: Fallback to Full Article Page if Strategy 1 did not yield an image
            if (!imgSrc) {
                const res = await fetch(titleLink.href);
                if (res.ok) {
                    const htmlText = await res.text();
                    const doc = parser.parseFromString(htmlText, 'text/html');
                    imgSrc = extractImageSrc(doc);
                }
            }

            // If an image was successfully extracted, render it
            if (imgSrc) {
                const imgLink = document.createElement('a');
                imgLink.href = titleLink.href;
                imgLink.className = 'custom-toc-link';
                if (titleLink.target) imgLink.target = titleLink.target;

                const img = document.createElement('img');
                img.src = imgSrc;
                img.className = 'custom-toc-img';
                img.alt = 'TOC Graphic';

                imgLink.appendChild(img);
                wrapper.innerHTML = '';
                wrapper.appendChild(imgLink);
                return;
            }

            // Remove wrapper if no image was found
            wrapper.remove();
        } catch (err) {
            console.error('Failed to retrieve TOC graphic:', titleLink.href, err);
            wrapper.remove();
        }
    }

    // 5. Initial execution and MutationObserver setup
    scanAndObserve();

    const pageObserver = new MutationObserver(() => scanAndObserve());
    const targetNode = document.querySelector('.widget-ArticleListGroups') || document.body;
    pageObserver.observe(targetNode, { childList: true, subtree: true });

})();