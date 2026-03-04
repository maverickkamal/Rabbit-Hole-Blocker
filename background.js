var YOUTUBE_CSS = [
    'css/youtube-feed.css',
    'css/youtube-sidebar.css',
    'css/youtube-comments.css',
    'css/youtube-shorts.css'
];

var REDDIT_CSS = [
    'css/reddit-feed.css',
    'css/reddit-sidebar.css'
];

var DEFAULTS = {
    enabled: true,
    sites: {
        youtube: { active: true },
        reddit: { active: true }
    }
};

function isYouTube(url) {
    return /^https?:\/\/(www\.)?youtube\.com/i.test(url);
}

function isReddit(url) {
    return /^https?:\/\/(www\.)?reddit\.com/i.test(url);
}

function injectFiles(tabId, files) {
    files.forEach(function (file) {
        chrome.scripting.insertCSS({
            target: { tabId: tabId },
            files: [file]
        }).catch(function () { });
    });
}

function removeFiles(tabId, files) {
    files.forEach(function (file) {
        chrome.scripting.removeCSS({
            target: { tabId: tabId },
            files: [file]
        }).catch(function () { });
    });
}

function applyToTab(tabId, url, data) {
    if (!data.enabled) {
        removeFiles(tabId, YOUTUBE_CSS.concat(REDDIT_CSS));
        return;
    }

    if (isYouTube(url)) {
        if (data.sites.youtube.active) {
            injectFiles(tabId, YOUTUBE_CSS);
        } else {
            removeFiles(tabId, YOUTUBE_CSS);
        }
    }

    if (isReddit(url)) {
        if (data.sites.reddit.active) {
            injectFiles(tabId, REDDIT_CSS);
        } else {
            removeFiles(tabId, REDDIT_CSS);
        }
    }
}

function applyToAllTabs(data) {
    chrome.tabs.query({ url: ['*://*.youtube.com/*', '*://*.reddit.com/*'] }, function (tabs) {
        tabs.forEach(function (tab) {
            applyToTab(tab.id, tab.url, data);
        });
    });
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.get(DEFAULTS, function (existing) {
        var merged = {
            enabled: existing.enabled !== undefined ? existing.enabled : DEFAULTS.enabled,
            sites: existing.sites || DEFAULTS.sites
        };
        chrome.storage.local.set(merged);
    });
});

chrome.storage.onChanged.addListener(function () {
    chrome.storage.local.get(DEFAULTS, function (data) {
        if (!data.sites) data.sites = DEFAULTS.sites;
        applyToAllTabs(data);
    });
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && (isYouTube(tab.url) || isReddit(tab.url))) {
        chrome.storage.local.get(DEFAULTS, function (data) {
            if (!data.sites) data.sites = DEFAULTS.sites;
            applyToTab(tabId, tab.url, data);
        });
    }
});
