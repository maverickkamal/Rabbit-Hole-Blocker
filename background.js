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
    },
    focus: { sessionStart: null, todaySeconds: 0, streak: 0, lastDate: null },
    breakUntil: null,
    breakDuration: null
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

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

function handleDayRollover(focus) {
    var today = getTodayStr();
    if (!focus.lastDate) {
        focus.lastDate = today;
        focus.streak = 1;
        return focus;
    }
    if (focus.lastDate === today) return focus;

    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (focus.lastDate === yesterdayStr) {
        focus.streak = (focus.streak || 0) + 1;
    } else {
        focus.streak = 1;
    }
    focus.todaySeconds = 0;
    focus.lastDate = today;
    return focus;
}

function handleSessionChange(wasEnabled, isEnabled, focus) {
    var now = Date.now();

    if (isEnabled && !wasEnabled) {
        focus.sessionStart = now;
        focus = handleDayRollover(focus);
    }

    if (!isEnabled && wasEnabled && focus.sessionStart) {
        var elapsed = Math.floor((now - focus.sessionStart) / 1000);
        focus.todaySeconds = (focus.todaySeconds || 0) + elapsed;
        focus.sessionStart = null;
        focus.lastDate = getTodayStr();
    }

    return focus;
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.get(DEFAULTS, function (existing) {
        var merged = {
            enabled: existing.enabled !== undefined ? existing.enabled : DEFAULTS.enabled,
            sites: {},
            focus: existing.focus || DEFAULTS.focus,
            breakUntil: existing.breakUntil || null,
            breakDuration: existing.breakDuration || null
        };

        ['youtube', 'reddit'].forEach(function (site) {
            var def = DEFAULTS.sites[site];
            var cur = (existing.sites && existing.sites[site]) || {};
            merged.sites[site] = {};
            Object.keys(def).forEach(function (key) {
                merged.sites[site][key] = cur[key] !== undefined ? cur[key] : def[key];
            });
        });

        if (merged.enabled && !merged.focus.sessionStart) {
            merged.focus.sessionStart = Date.now();
            merged.focus = handleDayRollover(merged.focus);
        }

        chrome.storage.local.set(merged);
    });

    chrome.alarms.create('dayRollover', { periodInMinutes: 1 });
});

chrome.storage.onChanged.addListener(function (changes) {
    chrome.storage.local.get(DEFAULTS, function (data) {
        if (!data.sites) data.sites = DEFAULTS.sites;
        applyToAllTabs(data);
    });

    if (changes.enabled) {
        var wasEnabled = changes.enabled.oldValue;
        var isEnabled = changes.enabled.newValue;
        chrome.storage.local.get(DEFAULTS, function (data) {
            var focus = data.focus || DEFAULTS.focus;
            focus = handleSessionChange(wasEnabled, isEnabled, focus);
            chrome.storage.local.set({ focus: focus });
        });
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && (isYouTube(tab.url) || isReddit(tab.url))) {
        chrome.storage.local.get(DEFAULTS, function (data) {
            if (!data.sites) data.sites = DEFAULTS.sites;
            applyToTab(tabId, tab.url, data);
        });
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === 'breakEnd') {
        chrome.storage.local.set({
            enabled: true,
            breakUntil: null,
            breakDuration: null
        });
    }

    if (alarm.name === 'dayRollover') {
        chrome.storage.local.get(DEFAULTS, function (data) {
            var focus = data.focus || DEFAULTS.focus;
            var oldDate = focus.lastDate;
            focus = handleDayRollover(focus);
            if (focus.lastDate !== oldDate) {
                chrome.storage.local.set({ focus: focus });
            }
        });
    }
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.breakUntil && changes.breakUntil.newValue) {
        var breakUntil = changes.breakUntil.newValue;
        var delay = breakUntil - Date.now();
        if (delay > 0) {
            chrome.alarms.create('breakEnd', { when: breakUntil });
        }
    }
    if (changes.breakUntil && !changes.breakUntil.newValue) {
        chrome.alarms.clear('breakEnd');
    }
});
