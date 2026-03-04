var toggle = document.getElementById('toggle');
var statusEl = document.getElementById('status');
var ytToggle = document.getElementById('toggle-youtube');
var rdToggle = document.getElementById('toggle-reddit');
var ytRow = document.getElementById('youtube-row');
var rdRow = document.getElementById('reddit-row');

var defaults = {
    enabled: true,
    sites: {
        youtube: { active: true },
        reddit: { active: true }
    }
};

function updateMasterUI(enabled) {
    toggle.checked = enabled;
    statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
    statusEl.className = 'status ' + (enabled ? 'on' : 'off');
    ytRow.classList.toggle('disabled', !enabled);
    rdRow.classList.toggle('disabled', !enabled);
}

function updateSiteUI(data) {
    ytToggle.checked = data.sites.youtube.active;
    rdToggle.checked = data.sites.reddit.active;
}

chrome.storage.local.get(defaults, function (data) {
    if (!data.sites) data.sites = defaults.sites;
    updateMasterUI(data.enabled);
    updateSiteUI(data);
});

toggle.addEventListener('change', function () {
    var enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateMasterUI(enabled);
});

ytToggle.addEventListener('change', function () {
    chrome.storage.local.get(defaults, function (data) {
        if (!data.sites) data.sites = defaults.sites;
        data.sites.youtube.active = ytToggle.checked;
        chrome.storage.local.set({ sites: data.sites });
    });
});

rdToggle.addEventListener('change', function () {
    chrome.storage.local.get(defaults, function (data) {
        if (!data.sites) data.sites = defaults.sites;
        data.sites.reddit.active = rdToggle.checked;
        chrome.storage.local.set({ sites: data.sites });
    });
});
