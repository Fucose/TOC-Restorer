// ==UserScript==
// @name         ACS & RSC TOC Restorer
// @namespace    https://github.com/Fucose/TOC-Restorer
// @version      4.5.2
// @description  Restores TOC / Visual Abstract graphics on ACS & RSC article lists (ASAP, Issue, Search) into a 2-column layout, and collapses the right sidebar into a slide-out panel.
// @author       Yingjie Wang @ SIOC
// @homepageURL  https://github.com/Fucose/TOC-Restorer
// @supportURL   https://github.com/Fucose/TOC-Restorer/issues
// @updateURL    https://raw.githubusercontent.com/Fucose/TOC-Restorer/main/toc-restorer.js
// @downloadURL  https://raw.githubusercontent.com/Fucose/TOC-Restorer/main/toc-restorer.js
// @match        https://pubs.acs.org/*
// @match        https://pubs.rsc.org/*
// @run-at       document-idle
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 1. Inject CSS styles supporting both Native TOC (ACS Issues) and Fetched TOC (ASAP/RSC Issues)
    const style = document.createElement('style');
    style.textContent = `
        /* ========================================================
           MODE A: Fetched TOC Layout (ASAP, RSC Issue & Search Pages)
           ======================================================== */
        .has-custom-toc {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: stretch !important;
            gap: 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .custom-toc-left {
            flex: 1 1 56% !important;
            min-width: 0 !important;
        }

        .custom-toc-right {
            flex: 0 0 40% !important;
            width: 40% !important;
            margin-left: auto !important;
            position: relative !important;
            min-height: 180px !important;
            box-sizing: border-box !important;
            background-color: transparent !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
        }

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

        /* ========================================================
           MODE B: Native TOC Restructuring (ACS Issue Pages)
           ======================================================== */
        .al-article-item-wrap.has-native-toc {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: stretch !important;
            gap: 16px !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .al-article-item-wrap.has-native-toc .al-article-items {
            flex: 1 1 56% !important;
            min-width: 0 !important;
            width: auto !important;
        }

        .al-article-item-wrap.has-native-toc .issue-graphical-abstract {
            flex: 0 0 40% !important;
            width: 40% !important;
            margin-left: auto !important;
            order: 2 !important;
            position: relative !important;
            min-height: 180px !important;
            box-sizing: border-box !important;
            background-color: transparent !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 6px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            overflow: hidden !important;
            padding: 6px !important;
        }

        .al-article-item-wrap.has-native-toc .issue-graphical-abstract a {
            position: absolute !important;
            top: 6px !important;
            bottom: 6px !important;
            left: 6px !important;
            right: 6px !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            width: auto !important;
            height: auto !important;
            text-decoration: none !important;
        }

        .al-article-item-wrap.has-native-toc .issue-graphical-abstract img {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain !important;
            display: block !important;
            border-radius: 4px !important;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06) !important;
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out !important;
        }

        .al-article-item-wrap.has-native-toc .issue-graphical-abstract a:hover img {
            transform: scale(1.02) !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.12) !important;
        }

        /* Loading UI & Spinner */
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

        /* Mobile Viewport Responsiveness */
        @media (max-width: 768px) {
            .has-custom-toc,
            .al-article-item-wrap.has-native-toc {
                flex-direction: column !important;
            }
            .custom-toc-right,
            .al-article-item-wrap.has-native-toc .issue-graphical-abstract {
                width: 100% !important;
                flex: 1 1 100% !important;
                min-height: 180px !important;
                margin-top: 10px !important;
                margin-left: 0 !important;
            }
        }

        /* ========================================================
           MODULE C: Collapsible Right Sidebar (off-canvas)
           #Sidebar is pulled off-screen; the center column reclaims its
           width. A floating toggle slides it back in on demand. No DOM is
           moved, which keeps Silverchair's own ad/widget JS intact.
           ======================================================== */
        body.toc-sidebar-active { --toc-sidebar-w: min(340px, 90vw); }

        body.toc-sidebar-active #Sidebar,
        body.toc-sidebar-active .issue-sidebar {
            position: fixed !important;
            top: 0 !important;
            right: 0 !important;
            height: 100vh !important;
            width: var(--toc-sidebar-w) !important;
            z-index: 100000 !important;
            overflow-y: auto !important;
            background: #fff !important;
            box-shadow: -3px 0 12px rgba(0,0,0,0.12) !important;
            transform: translateX(100%) !important;
            transition: transform 0.25s ease !important;
            box-sizing: border-box !important;
            padding: 16px 20px !important;
        }
        body.toc-sidebar-active.toc-sidebar-open #Sidebar,
        body.toc-sidebar-active.toc-sidebar-open .issue-sidebar {
            transform: translateX(0) !important;
        }

        /* Convert the layout wrapper to flex so #ContentColumn absorbs the
           freed width. :has() targets whatever directly contains the center
           column; the known wrapper classes act as a fallback for older
           browsers that don't support :has(). */
        body.toc-sidebar-active :has(> .page-column--center),
        body.toc-sidebar-active .issue-browse_content,
        body.toc-sidebar-active #divSearch {
            display: flex !important;
            align-items: flex-start !important;
        }
        body.toc-sidebar-active .page-column--center {
            flex: 1 1 0 !important;
            min-width: 0 !important;
            width: auto !important;
            max-width: none !important;
        }
        body.toc-sidebar-active .page-column--left {
            flex: 0 0 220px !important;
            box-sizing: border-box !important;
        }

        /* #InfoColumn is the page's section-outline nav (jump links to article
           groups). Two of the site's own bugs are corrected here at once:
           (1) On ASAP (pg_articlesbygroup) the native grid reserves areas only
               for ContentColumn + Sidebar, so #InfoColumn is auto-flowed to the
               page footer instead of acting as the left nav it's meant to be.
           (2) The platform styles its inner .info-inner-wrap.can-stick as
               position:sticky, but that only engages when #InfoColumn is tall
               enough to have room to stick. The native Issue grid stretches it
               to the article-list height; our flex conversion uses
               align-items:flex-start, which would collapse it and kill the
               sticky — so the nav scrolls away instead of pinning.
           Stretching #InfoColumn back to full height lets the platform's own
           sticky take over: the nav pins near the top while you scroll the
           article list, just like the Search page / ACS Issue. It's also robust
           to a future site fix — stretched or not, #InfoColumn lands as a left
           column either way. (ACS ASAP has no #InfoColumn, so this is a no-op
           there; pages with no #Sidebar never get toc-sidebar-active.) */
        body.toc-sidebar-active #InfoColumn {
            align-self: stretch !important;
        }

        /* Floating toggle (vertical tab on the right edge) */
        #toc-sidebar-toggle {
            position: fixed !important;
            right: 0 !important;
            top: 20vh !important;
            z-index: 100001 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 10px !important;
            background: #001d2f !important;
            color: #fff !important;
            border: none !important;
            border-radius: 6px 0 0 6px !important;
            padding: 14px 10px !important;
            cursor: pointer !important;
            font-family: Roboto, Helvetica, Arial, sans-serif !important;
            font-size: 16px !important;
            font-weight: 700 !important;
            box-shadow: -2px 0 6px rgba(0,0,0,0.15) !important;
            transition: background 0.15s ease, opacity 0.2s ease, right 0.25s ease !important;
        }
        #toc-sidebar-toggle:hover { background: #004976 !important; }
        #toc-sidebar-toggle .toc-toggle-label {
            display: inline-block !important;
            writing-mode: vertical-rl !important;
            transform: rotate(180deg) !important; /* read bottom-to-top (CCW 90°) */
            line-height: 1.1 !important;
        }
        #toc-sidebar-toggle .toc-toggle-arrow { flex: 0 0 auto !important; transition: transform 0.25s ease !important; }

        /* When open, the toggle persists as a close handle: label swaps
           "More" → "Hide", the chevron flips outward (‹ → ›), and it slides to
           the panel seam (the sidebar's left edge) so it sits between the
           content and the panel instead of floating over panel content. */
        #toc-sidebar-toggle .toc-toggle-label--hide { display: none !important; }
        body.toc-sidebar-open #toc-sidebar-toggle .toc-toggle-label--more { display: none !important; }
        body.toc-sidebar-open #toc-sidebar-toggle .toc-toggle-label--hide { display: inline-block !important; }
        body.toc-sidebar-open .toc-toggle-arrow { transform: scaleX(-1) !important; }
        body.toc-sidebar-open #toc-sidebar-toggle { right: var(--toc-sidebar-w) !important; }

        /* Backdrop dims the page while the sidebar is slid out */
        #toc-sidebar-backdrop {
            position: fixed !important;
            inset: 0 !important;
            background: rgba(0,0,0,0.3) !important;
            z-index: 99999 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.25s ease !important;
        }
        body.toc-sidebar-open #toc-sidebar-backdrop {
            opacity: 1 !important;
            pointer-events: auto !important;
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
        // Step A: Handle ACS Issue pages with pre-existing .issue-graphical-abstract
        const nativeWraps = document.querySelectorAll('.al-article-item-wrap');
        nativeWraps.forEach(wrap => {
            const nativeToc = wrap.querySelector('.issue-graphical-abstract');
            const card = wrap.querySelector('.al-article-items');
            if (nativeToc && card) {
                if (!wrap.classList.contains('has-native-toc')) {
                    wrap.classList.add('has-native-toc');
                    // Move native TOC element to the end so it renders on the right side
                    if (wrap.firstElementChild === nativeToc) {
                        wrap.appendChild(nativeToc);
                    }
                }
                card.dataset.tocProcessed = 'true'; // Skip API fetching for native TOC items

                // Step A2: The platform's native TOC anchor points at the signed
                // CDN image (…?Expires=…&Signature=…) and its click is hijacked by
                // Silverchair's modal handler (preventDefault → #revealModal zoom).
                // The image is already loaded, so keep it — just drop the modal
                // handler and repoint the link at the article, making the whole
                // graphic click through to the paper. Idempotent.
                const nativeLink = nativeToc.querySelector('a[href]');
                const titleLink = card.querySelector('.al-title a, .item-title a, h3.customLink a, .article-title a, h5 a, h3 a');
                if (nativeLink && titleLink && !nativeLink.dataset.tocRepointed) {
                    nativeLink.dataset.tocRepointed = 'true';
                    const jq = window.jQuery || window.$;
                    // Unbind the modal handler only when one is actually present,
                    // so a future site fix (link repaired / modal removed) is a no-op.
                    if (jq && jq._data && jq._data(nativeLink, 'events') && jq._data(nativeLink, 'events').click) {
                        jq(nativeLink).off('click');
                    }
                    if (nativeLink.href !== titleLink.href) {
                        nativeLink.href = titleLink.href;
                        if (titleLink.target) nativeLink.target = titleLink.target;
                        else nativeLink.removeAttribute('target'); // drop stale _blank from setAllLinksTarget
                    }
                }
            }
        });

        // Step B: Handle cards requiring fetched TOC (ASAP, RSC Issue, and Search pages)
        // Anchor on the Abstract button — the one stable element present on every
        // list page (ASAP / Issue / Search) — then locate its card container.
        const absBtns = document.querySelectorAll('.showAbstractLink[data-articleid], .js-show-abstract[data-articleid]');
        absBtns.forEach(btn => {
            const card = btn.closest('.al-article-items, .item-info');
            if (!card || card.dataset.tocProcessed) return;
            card.dataset.tocProcessed = 'true';
            // Skip cards that already show a TOC: native (ACS Issue) or already rendered
            const wrap = card.closest('.al-article-item-wrap');
            const hasNative = card.querySelector('.issue-graphical-abstract') ||
                              (wrap && wrap.querySelector('.issue-graphical-abstract'));
            if (hasNative || card.querySelector('.custom-toc-right')) return;
            observer.observe(card);
        });

        // Step C: Give the ASAP InfoColumn nav a heading (every other list page
        // ships with one, e.g. "In this Issue"; ASAP has none).
        ensureAsapInfoTitle();

        // Step D: Scroll-spy — highlight the nav link of the section in view.
        setupAsapScrollSpy();
    }

    // On ArticlesByGroup (ASAP) pages the left nav is just two bare jump links
    // (Advance Articles / Accepted manuscripts) with no heading, which looks
    // orphaned next to the titled navs on Issue/Search pages. Inject a matching
    // title that reuses the platform's own .in-this-issue-title styling.
    // Idempotent. (ACS ASAP has no #InfoColumn, so this is a no-op there.)
    function ensureAsapInfoTitle() {
        if (!document.body.classList.contains('pg_articlesbygroup')) return;
        const infoCol = document.getElementById('InfoColumn');
        if (!infoCol || infoCol.dataset.tocTitled) return;
        const wrap = infoCol.querySelector('.info-widget-wrap');
        if (!wrap || wrap.querySelector('.in-this-issue-title')) return;
        const title = document.createElement('div');
        title.className = 'in-this-issue-title';
        title.textContent = 'Contents';
        wrap.insertBefore(title, wrap.firstChild);
        infoCol.dataset.tocTitled = 'true';
    }

    // Scroll-spy for the ASAP nav: as the page scrolls, highlight the link whose
    // target section is in view — mirroring the Issue page. The platform already
    // styles .section-jump-link.active (bold + black); we only toggle the class.
    // Idempotent; scoped to ASAP (Issue already has its own native scroll-spy).
    function setupAsapScrollSpy() {
        if (!document.body.classList.contains('pg_articlesbygroup')) return;
        const infoCol = document.getElementById('InfoColumn');
        if (!infoCol || infoCol.dataset.tocSpy) return;
        const targets = [...infoCol.querySelectorAll('.section-jump-link')].map(item => {
            const a = item.querySelector('a[href^="#"]');
            const id = a && a.getAttribute('href').slice(1);
            return { item, el: id ? document.getElementById(id) : null };
        });
        if (!targets.some(t => t.el)) return; // target sections not present yet
        infoCol.dataset.tocSpy = 'true';

        const THRESHOLD = 120; // px from viewport top, clearing the sticky toolbar
        let ticking = false;
        const update = () => {
            ticking = false;
            let active = 0; // default: first section (top of page)
            for (let i = 0; i < targets.length; i++) {
                if (targets[i].el && targets[i].el.getBoundingClientRect().top <= THRESHOLD) {
                    active = i;
                }
            }
            targets.forEach((t, i) => t.item.classList.toggle('active', i === active));
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { ticking = true; requestAnimationFrame(update); }
        }, { passive: true });
        update();
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
        // Expanded title selectors to support both ASAP (.al-title) and Issue (.item-title) pages
        const titleLink = card.querySelector('.al-title a, .item-title a, h3.customLink a, .article-title a, h5 a, h3 a');
        if (!titleLink) return;

        // Apply flex layout to card
        card.classList.add('has-custom-toc');

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

        // Revert the 2-column layout when no TOC image can be obtained
        const cleanup = () => {
            rightCol.remove();
            while (leftCol.firstChild) card.insertBefore(leftCol.firstChild, leftCol);
            leftCol.remove();
            card.classList.remove('has-custom-toc');
        };

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

            // If no image exists, revert the layout
            cleanup();
        } catch (err) {
            console.error('Failed to retrieve TOC graphic:', titleLink.href, err);
            cleanup();
        }
    }

    // 5. Collapsible right sidebar (off-canvas, default collapsed).
    //    Called once at startup; if #Sidebar isn't injected yet, it watches the
    //    document until it appears. Idempotent (guarded by tocSidebarInit).
    function setupSidebar() {
        if (document.body.dataset.tocSidebarInit) return;

        // Only collapse the right sidebar on article-LIST pages (ASAP / Issue /
        // Search). Article-reading pages keep their sidebar — hiding it widens
        // the text column and hurts readability. The pg_* body class is the same
        // signal the TOC scan keys on (list pages carry these; pg_article doesn't).
        const b = document.body;
        const isListPage = b.classList.contains('pg_articlesbygroup') ||
                           b.classList.contains('pg_issue') ||
                           b.classList.contains('pg_searchresults');
        if (!isListPage) return;

        const sidebar = document.querySelector('#Sidebar, .issue-sidebar');
        if (!sidebar) {
            // #Sidebar is injected asynchronously by Silverchair, and as a sibling
            // of #ContentColumn it may land outside the TOC observer's subtree — so
            // watch the whole document until it appears, then stop. Self-disconnects
            // after 30s so pages with no sidebar (ACS Issue/Search) don't loop forever.
            if (!setupSidebar._watcher) {
                setupSidebar._watcher = new MutationObserver(() => setupSidebar());
                setupSidebar._watcher.observe(document.body, { childList: true, subtree: true });
                setTimeout(() => {
                    if (setupSidebar._watcher) {
                        setupSidebar._watcher.disconnect();
                        setupSidebar._watcher = null;
                    }
                }, 30000);
            }
            return;
        }
        if (setupSidebar._watcher) { setupSidebar._watcher.disconnect(); setupSidebar._watcher = null; }
        document.body.dataset.tocSidebarInit = 'true';
        document.body.classList.add('toc-sidebar-active'); // hide off-canvas + reclaim width

        const mountToggle = () => {
            if (document.getElementById('toc-sidebar-toggle')) return;
            // Only render a toggle when the sidebar actually has something to show
            // (an empty sidebar, e.g. ACS ASAP, just gets hidden silently).
            const hasContent = sidebar.innerText.trim().length > 0 ||
                               sidebar.querySelector('img, iframe');
            if (!hasContent) return;

            const btn = document.createElement('button');
            btn.id = 'toc-sidebar-toggle';
            btn.type = 'button';
            btn.title = 'Show sidebar';
            btn.innerHTML = `<span class="toc-toggle-label toc-toggle-label--more">More</span>
                <span class="toc-toggle-label toc-toggle-label--hide">Hide</span>
                <svg class="toc-toggle-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>`;
            btn.addEventListener('click', () => {
                document.body.classList.toggle('toc-sidebar-open');
            });
            document.body.appendChild(btn);

            const backdrop = document.createElement('div');
            backdrop.id = 'toc-sidebar-backdrop';
            backdrop.addEventListener('click', () => {
                document.body.classList.remove('toc-sidebar-open');
            });
            document.body.appendChild(backdrop);
        };

        // Sidebar content (ads/widgets) populates after the node appears; retry briefly.
        mountToggle();
        let tries = 0;
        const timer = setInterval(() => {
            mountToggle();
            if (++tries >= 8 || document.getElementById('toc-sidebar-toggle')) clearInterval(timer);
        }, 500);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') document.body.classList.remove('toc-sidebar-open');
        });
    }

    // 6. Initial execution and MutationObserver setup
    scanAndObserve();
    setupSidebar(); // #Sidebar arrives async; this starts watching for it

    let scanTimer;
    const pageObserver = new MutationObserver(() => {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(scanAndObserve, 150);
    });
    const targetNode = document.querySelector('.widget-ArticleListGroups, .article-list-resources, #ContentColumn, #searchContent') || document.body;
    pageObserver.observe(targetNode, { childList: true, subtree: true });

})();
