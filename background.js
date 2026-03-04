var CSS_MAP = {
    youtube: {
        feed: 'css/youtube-feed.css',
        sidebar: 'css/youtube-sidebar.css',
        comments: 'css/youtube-comments.css',
        shorts: 'css/youtube-shorts.css'
    },
    reddit: {
        feed: 'css/reddit-feed.css',
        sidebar: 'css/reddit-sidebar.css'
    }
};

var ALL_CSS = Object.keys(CSS_MAP).reduce(function (arr, site) {
    return arr.concat(Object.values(CSS_MAP[site]));
}, []);

var DEFAULTS = {
    enabled: true,
    sites: {
        youtube: { active: true, feed: true, sidebar: true, comments: true, shorts: true },
        reddit: { active: true, feed: true, sidebar: true }
    }
};

function isYouTube(url) {
    return /^https?:\/\/(www\.)?youtube\.com/i.test(url);
}

function isReddit(url) {
    return /^https?:\/\/(www\.)?reddit\.com/i.test(url);
}

function injectFile(tabId, file) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: [file]
    }).catch(function () { });
}

function removeFile(tabId, file) {
    chrome.scripting.removeCSS({
        target: { tabId: tabId },
        files: [file]
    }).catch(function () { });
}

function getSiteKey(url) {
    if (isYouTube(url)) return 'youtube';
    if (isReddit(url)) return 'reddit';
    return null;
}

function applyToTab(tabId, url, data) {
    if (!data.enabled) {
        ALL_CSS.forEach(function (file) { removeFile(tabId, file); });
        return;
    }

    var siteKey = getSiteKey(url);
    if (!siteKey) return;

    var siteConfig = data.sites[siteKey];
    var siteCSS = CSS_MAP[siteKey];

    Object.keys(siteCSS).forEach(function (element) {
        var file = siteCSS[element];
        if (siteConfig.active && siteConfig[element] !== false) {
            injectFile(tabId, file);
        } else {
            removeFile(tabId, file);
        }
    });
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
            sites: {}
        };

        ['youtube', 'reddit'].forEach(function (site) {
            var def = DEFAULTS.sites[site];
            var cur = (existing.sites && existing.sites[site]) || {};
            merged.sites[site] = {};
            Object.keys(def).forEach(function (key) {
                merged.sites[site][key] = cur[key] !== undefined ? cur[key] : def[key];
            });
        });

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
