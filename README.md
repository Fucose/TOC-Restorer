# ACS & RSC ASAP TOC Restorer

> A lightweight browser userscript that restores missing Table of Contents (TOC) / Visual Abstract graphics on ACS and RSC ASAP/Advance Article pages following their Silverchair platform migration.

---

## 🌟 Features

* **🚀 Ultra-Fast & Lightweight:** Leverages Silverchair’s native AJAX abstract endpoint (~2 KB payload per article) for instant image retrieval without cluttering network traffic.
* **⚡ Intelligent Lazy Loading:** Built with `IntersectionObserver`—images are fetched only when scrolled into view, preventing `429 Too Many Requests` rate limits.
* **🖼️ Interactive & Clickable:** Restored TOC images mirror the article title’s link and target properties, allowing seamless navigation directly to full articles.
* **🎨 Modern Flat UI:** Designed to blend naturally into scientific journal interfaces, featuring a flat CSS ring spinner instead of obtrusive emojis or heavy spinners.
* **🔄 Built-in Fallback Mechanism:** Includes a automatic fallback to full-page parsing if an article lacks an AJAX endpoint, ensuring 100% rendering reliability.

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

---

## 🧪 Supported Websites

The script automatically activates when browsing any ACS or RSC journal domain on the Silverchair architecture, including but not limited to:

* **ACS Publications:** [ACS ASAP Articles](https://pubs.acs.org/jacsat/latest-articles) (*JACS*, *Org. Lett.*, *J. Org. Chem.*, etc.)
* **RSC Publishing:** [RSC Advance Articles](https://pubs.rsc.org/sc/latest-articles) (*Chem. Sci.*, *Org. Chem. Front.*, *Chem. Commun.*, etc.)

---

## 🔧 Technical Architecture

```
[User Scrolls Page]
        │
        ▼
[IntersectionObserver Triggers]
        │
        ├─► 1. Primary Strategy: Request Silverchair AJAX API (~2KB payload)
        │       └─► Parse JSON -> Extract <img> src -> Render TOC Link
        │
        └─► 2. Fallback Strategy (if API fails / missing):
                └─► Fetch Full Article Page HTML -> Parse DOM -> Render TOC Link

```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
