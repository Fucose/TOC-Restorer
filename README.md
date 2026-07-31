# ACS & RSC TOC Restorer

> A lightweight browser userscript for ACS & RSC journals on the Silverchair platform. It restores the missing TOC / Visual Abstract graphics on article-list pages (ASAP, Issue, Search) into a clean 2-column layout, reclaims screen space by collapsing the right sidebar into a slide-out panel, and upgrades the left navigation into a sticky, scroll-spy section outline.

---

## 🌟 Features

### TOC / Visual Abstract Restoration
* **🚀 Ultra-Fast & Lightweight:** Leverages Silverchair's native AJAX abstract endpoint (~2 KB payload per article) for instant image retrieval without cluttering network traffic.
* **⚡ Intelligent Lazy Loading:** Built with `IntersectionObserver` — images are fetched only when scrolled into view, preventing `429 Too Many Requests` rate limits.
* **🔍 Universal Detection:** Cards are detected by anchoring on the Abstract button, so ASAP, Issue, *and* Search result pages are all covered — cross-journal search hits (e.g. an RSC global search returning a *Chem. Commun.* article) resolve the correct journal automatically.
* **🖼️ Interactive & Clickable:** Restored TOC images mirror the article title's link and target, so clicking jumps straight to the full article.
* **🎨 Modern Flat UI:** Restored cards blend into the journal interface with a flat CSS ring spinner and subtle hover effects.
* **🔄 Built-in Fallback:** If an article lacks an AJAX endpoint (or it fails), the script falls back to parsing the full article page, ensuring reliable rendering.
* **🔗 Native Graphic Click-Through (ACS Issue):** On ACS Issue pages the platform already renders the TOC graphic natively, but its link points at the signed CDN image (and clicking pops an image zoom modal). The script keeps the already-loaded image, drops the zoom-modal handler, and repoints the link at the article — clicking the graphic opens the paper with zero extra network requests.

### Collapsible Right Sidebar
* **🗂️ Off-Canvas Sidebar:** The right `#Sidebar` (ads, "New & popular" articles, journal socials) is collapsed by default, giving the article list the full viewport width.
* **📌 Slide-Out Panel:** A **More** tab on the right edge (upper area) slides the sidebar back in on demand; click the backdrop or press `Esc` to close.
* **🛡️ Ad-Friendly:** Ads load normally inside the panel and remain blockable by your ad blocker — the script never hides or interferes with ad content.
* **🤫 Silent When Empty:** On pages with an empty sidebar (e.g. ACS ASAP), the whitespace is reclaimed with no stray toggle button.

### Enhanced Left Navigation (InfoColumn)
* **📌 Sticky Section Outline:** The left `#InfoColumn` nav pins near the top of the viewport while you scroll the article list, so the jump links stay one click away — the sticky behavior the platform only grants to some pages (Search, ACS Issue).
* **📐 Consistent 220px Column:** The nav is locked to the platform's native 220px width on every list page. On RSC ASAP the site's own grid wrongly strands `#InfoColumn` at the page footer, and without this fix the RSC search filters would balloon to ~790px wide.
* **🏷️ ASAP Heading:** The ASAP nav ships with no title; a **Contents** heading is injected so it matches the titled navs on Issue/Search pages.
* **🔦 Scroll-Spy:** As you scroll, the nav link of the section currently in view is highlighted (bold + black), mirroring the Issue page. Active on ASAP only, since Issue already has its own native scroll-spy.

---

## 📋 Prerequisites

To run this script, you need a **Userscript Manager** browser extension. We strongly recommend **Tampermonkey**.

Supported Browsers & Extensions:

* **Tampermonkey** ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) / [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) / [Edge](https://microsoftedge.microsoft.com/addons/detail/Tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) / [Safari](https://apps.apple.com/us/app/tampermonkey/id1482490089))
* **Violentmonkey** or **Greasemonkey**

---

## 🚀 Installation

1. Install the **Tampermonkey** extension for your browser if you haven't already.
2. Click the Tampermonkey icon in your browser toolbar and select **Create a new script...**.
3. Clear any template code inside the editor.
4. Copy the entire contents of `toc-restorer.js` and paste it into the editor.
5. Save the script (`Ctrl + S` or `Cmd + S`).

> **Note:** if you previously installed the script under its old name, remove the old entry after installing this version so the two don't coexist.

---

## 🧪 Supported Websites

The script automatically activates when browsing any ACS or RSC journal domain on the Silverchair architecture, including but not limited to:

* **ACS Publications:** [ACS ASAP Articles](https://pubs.acs.org/jacsat/latest-articles), Issue pages, and [Search results](https://pubs.acs.org/jacsat/search-results) (*JACS*, *Org. Lett.*, *J. Org. Chem.*, etc.)
* **RSC Publishing:** [RSC Advance Articles](https://pubs.rsc.org/sc/latest-articles), Issue pages, and [Search results](https://pubs.rsc.org/search-results) (*Chem. Sci.*, *Org. Chem. Front.*, *Chem. Commun.*, etc.)

**TOC behavior:** On ACS Issue pages the platform already renders the TOC natively; the script realigns it into the 2-column layout and repoints its graphic at the article (the site links it to the signed CDN image and pops a zoom modal). On ASAP, RSC Issue, and Search pages the graphic is folded inside the "Abstract" button — the script fetches it via Silverchair's AJAX abstract endpoint and re-attaches it.

**Sidebar behavior:** The right sidebar is collapsed on pages that have one (ACS ASAP plus all RSC list pages). ACS Issue/Search pages have no sidebar and are left untouched.

**Left-nav behavior:** `#InfoColumn` is promoted to a sticky 220px navigation column on ASAP and Issue (the site leaves it stranded at the page footer on RSC ASAP), with scroll-spy active-link highlighting on ASAP.

---

## 🔧 Technical Architecture

```
[User Scrolls Page]
        │
        ▼
[IntersectionObserver Triggers]
        │
        ├─► 1. Primary Strategy: Silverchair AJAX abstract API (~2 KB)
        │       └─► Parse JSON -> Extract <img> -> Render TOC in 2-column card
        │
        └─► 2. Fallback Strategy (API fails / missing):
                └─► Fetch Full Article Page -> Parse DOM -> Render TOC

[Sidebar]  #Sidebar is injected asynchronously by Silverchair JS
        │
        ▼
[MutationObserver detects it] -> position:fixed off-canvas (CSS-only, no DOM moves)
        │
        └─► "More" tab slides it out on demand (backdrop / Esc closes)

[Left Nav]  #InfoColumn is stretched to full height (align-self: stretch) so the
        │   platform's own .info-inner-wrap.can-stick sticky engages — flex-start
        ▼   would collapse it and kill the sticky
[Sticky 220px outline] -> on ASAP a "Contents" heading is injected
        │
        └─► Scroll-spy toggles .section-jump-link.active on the section in view
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
