// ==UserScript==
// @name         ACS & RSC ASAP TOC Restorer (Unified 2-Column API Driven)
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Restores TOC / Visual Abstract graphics on ACS and RSC ASAP pages (40% right column, transparent background with border).
// @author       Yingjie Wang @ SIOC
// @match        https://pubs.acs.org/*
// @match        https://pubs.rsc.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Inject CSS styles for 40% right-aligned layout with transparent background
    const style = document.createElement('style');
    style.textContent = `
        /* Transform article card to Flexbox 2-Column layout */
        .al-article-items {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: stretch !important;
            gap: 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        /* Left Column: Text & Links (Takes remaining ~56% width) */
        .custom-toc-left {
            flex: 1 1 56% !important;
            min-width: 0 !important;
        }

        /* Right Column: TOC Container (Strict 40% width, transparent background, retained border) */
        .custom-toc-right {
            flex: 0 0 40% !important;
            width: 40% !important;
            margin-left: auto !important;
            position: relative !important;
            min-height: 120px !important;
            box-sizing: border-box !important;
            background-color: transparent !important; /* Transparent background */
            border: 1px solid #e2e8f0 !important;     /* Retained border */
            border-radius: 6px !important;             /* Retained rounded corners */
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
        }

        /* Clickable Link Container */
        .custom-toc-link {
            position: absolute !important;
            top: 6px !important;
            bottom: 6px !important;
            left: 6px !important;
            right: 6px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            text-decoration: none !important;
            outline: none !important;
            cursor: pointer !important;
        }

        /* Image Sizing & Hover effect */
        .custom-toc-img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            display: block !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out !important;
        }

        .custom-toc-link:hover .custom-toc-img {
            transform: scale(1.02) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
        }

        /* Flat Spinner & Loading State */
        .custom-toc-loading {
            font-size: 12px !important;
            color: #64748b !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }

        .custom-toc-spinner {
            width: 13px !important;
            height: 13px !important;
            border: 2px solid #cbd5e1 !important;
            border-top-color: #0284c7 !important;
            border-radius: 50% !important;
            animation: custom-toc-spin 0.75s linear infinite !important;
            display: inline-block !important;
            box-sizing: border-box !important;
        }

        @keyframes custom-toc-spin {
            to { transform: rotate(360deg); }
        }

        /* Responsive design for narrow mobile viewports */
        @media (max-width: 768px) {
            .al-article-items {
                flex-direction: column !important;
            }
            .custom-toc-right {
                width: 100% !important;
                flex: 1 1 100% !important;
                min-height: 180px !important;
                margin-top: 10px !important;
                margin-left: 0 !important;
            }
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

    // Helper: Extract TOC image URL from DOM
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

    // 4. Main layout restorer & image fetcher
    async function fetchAndRenderTOC(card) {
        const titleLink = card.querySelector('.al-title a');
        if (!titleLink) return;

        // Wrap existing content into Left Column container
        let leftCol = card.querySelector('.custom-toc-left');
        if (!leftCol) {
            leftCol = document.createElement('div');
            leftCol.className = 'custom-toc-left';
            while (card.firstChild) {
                leftCol.appendChild(card.firstChild);
            }
            card.appendChild(leftCol);
        }

        // Create Right Column container for TOC
        const rightCol = document.createElement('div');
        rightCol.className = 'custom-toc-right';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'custom-toc-loading';
        loadingDiv.innerHTML = `<span class="custom-toc-spinner"></span> Loading TOC...`;
        rightCol.appendChild(loadingDiv);

        card.appendChild(rightCol);

        // Extract metadata
        const articleId = card.dataset.articleId || card.querySelector('[data-articleid]')?.dataset.articleid;
        const pathSegments = titleLink.pathname.split('/').filter(Boolean);
        const journalCode = pathSegments[0];

        try {
            let imgSrc = null;

            // Strategy 1: Fast AJAX API (~2KB)
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
                    console.warn('AJAX Endpoint failed, falling back to full page:', apiErr);
                }
            }

            // Strategy 2: Full-Page Fallback
            if (!imgSrc) {
                const res = await fetch(titleLink.href);
                if (res.ok) {
                    const htmlText = await res.text();
                    const doc = parser.parseFromString(htmlText, 'text/html');
                    imgSrc = extractImageSrc(doc);
                }
            }

            // Render TOC image if found
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
                rightCol.innerHTML = '';
                rightCol.appendChild(imgLink);
                return;
            }

            // If no image exists, remove Right Column (Left Column automatically expands to 100%)
            rightCol.remove();
        } catch (err) {
            console.error('Failed to retrieve TOC graphic:', titleLink.href, err);
            rightCol.remove();
        }
    }

    // 5. Initial execution and MutationObserver setup
    scanAndObserve();

    const pageObserver = new MutationObserver(() => scanAndObserve());
    const targetNode = document.querySelector('.widget-ArticleListGroups') || document.body;
    pageObserver.observe(targetNode, { childList: true, subtree: true });

})();
