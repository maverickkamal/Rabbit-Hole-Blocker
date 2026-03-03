const MATCH_PATTERNS = ['*://*.youtube.com/*', '*://*.reddit.com/*'];

function isTargetUrl(url) {
    return /^https?:\/\/(www\.)?(youtube\.com|reddit\.com)/i.test(url);
}

function injectCSS(tabId) {
    chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['blocker.css']
    }).catch(function () { });
}

function removeCSS(tabId) {
    chrome.scripting.removeCSS({
        target: { tabId: tabId },
        files: ['blocker.css']
    }).catch(function () { });
}

function applyToAllTabs(enabled) {
    chrome.tabs.query({ url: MATCH_PATTERNS }, function (tabs) {
        tabs.forEach(function (tab) {
            if (enabled) {
                injectCSS(tab.id);
            } else {
                removeCSS(tab.id);
            }
        });
    });
}

chrome.runtime.onInstalled.addListener(function () {
    chrome.storage.local.set({ enabled: true });
});

chrome.storage.onChanged.addListener(function (changes) {
    if (changes.enabled) {
        applyToAllTabs(changes.enabled.newValue);
    }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url && isTargetUrl(tab.url)) {
        chrome.storage.local.get({ enabled: true }, function (data) {
            if (data.enabled) {
                injectCSS(tabId);
            }
        });
    }
});
