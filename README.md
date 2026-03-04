# Rabbit-Hole Blocker

A Chrome & Firefox browser extension that eliminates algorithmic distractions on **YouTube** and **Reddit**. It hides feeds, recommendations, comments, and shorts — leaving only the search bar and primary content viewer active.

![alt text](<images/image 1.png>)

![alt text](<images/image 2.png>)

![alt text](<images/image 3.png>)

![alt text](<images/image 4.png>)

## Features

- **Instant CSS injection** — no flickering, no heavy DOM manipulation
- **Per-site toggles** — enable/disable blocking for YouTube and Reddit independently
- **Granular element control** — choose exactly what to hide per site:
  - YouTube: Homepage Feed, Sidebar Recommendations, Comments, Shorts
  - Reddit: Home Feed, Sidebar / Trending
- **Focus timer & streak** — tracks your current session, daily total, and consecutive-day streak
- **Break mode** — take a 5, 10, or 15 minute break with a countdown timer and auto re-enable
- **Dark-themed popup** — minimal, premium UI with animated rabbit mascot

## Installation

### Chrome / Edge / Brave

1. Clone or download this repository
2. Open `chrome://extensions` in your browser
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked**
5. Select the `Rabbit-Hole Blocker` folder
6. The extension icon appears in your toolbar — click it to toggle

### Firefox

1. Rename `manifest.firefox.json` to `manifest.json` (back up the original first)
2. Open `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on**
4. Select the `manifest.json` file
5. The extension icon appears in your toolbar


## Browser Compatibility

| Browser | Manifest | Status |
|---------|----------|--------|
| Chrome  | V3       | ✅ Supported |
| Edge    | V3       | ✅ Supported |
| Brave   | V3       | ✅ Supported |
| Firefox | V2       | ✅ Supported (use `manifest.firefox.json`) |

