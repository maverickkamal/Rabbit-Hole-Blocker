var toggle = document.getElementById('toggle');
var statusEl = document.getElementById('status');
var ytToggle = document.getElementById('toggle-youtube');
var rdToggle = document.getElementById('toggle-reddit');
var ytRow = document.getElementById('youtube-row');
var rdRow = document.getElementById('reddit-row');
var ytElements = document.getElementById('youtube-elements');
var rdElements = document.getElementById('reddit-elements');

var ytCheckboxes = {
    feed: document.getElementById('yt-feed'),
    sidebar: document.getElementById('yt-sidebar'),
    comments: document.getElementById('yt-comments'),
    shorts: document.getElementById('yt-shorts')
};

var rdCheckboxes = {
    feed: document.getElementById('rd-feed'),
    sidebar: document.getElementById('rd-sidebar')
};

var defaults = {
    enabled: true,
    sites: {
        youtube: { active: true, feed: true, sidebar: true, comments: true, shorts: true },
        reddit: { active: true, feed: true, sidebar: true }
    }
};

function updateMasterUI(enabled) {
    toggle.checked = enabled;
    statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
    statusEl.className = 'status ' + (enabled ? 'on' : 'off');

    var siteGroups = document.querySelectorAll('.site-group');
    siteGroups.forEach(function (group) {
        var row = group.querySelector('.site-row');
        var list = group.querySelector('.element-list');
        row.classList.toggle('disabled', !enabled);
        list.classList.toggle('disabled', !enabled);
    });
}

function updateSiteUI(data) {
    var yt = data.sites.youtube;
    var rd = data.sites.reddit;

    ytToggle.checked = yt.active;
    rdToggle.checked = rd.active;

    ytCheckboxes.feed.checked = yt.feed !== false;
    ytCheckboxes.sidebar.checked = yt.sidebar !== false;
    ytCheckboxes.comments.checked = yt.comments !== false;
    ytCheckboxes.shorts.checked = yt.shorts !== false;

    rdCheckboxes.feed.checked = rd.feed !== false;
    rdCheckboxes.sidebar.checked = rd.sidebar !== false;
}

function setupCollapsible(row, elementList) {
    row.addEventListener('click', function (e) {
        if (e.target.closest('.switch')) return;
        row.classList.toggle('expanded');
        elementList.classList.toggle('open');
    });
}

setupCollapsible(ytRow, ytElements);
setupCollapsible(rdRow, rdElements);

chrome.storage.local.get(defaults, function (data) {
    if (!data.sites) data.sites = defaults.sites;
    if (data.sites.youtube.feed === undefined) data.sites.youtube = Object.assign({}, defaults.sites.youtube, data.sites.youtube);
    if (data.sites.reddit.feed === undefined) data.sites.reddit = Object.assign({}, defaults.sites.reddit, data.sites.reddit);
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

Object.keys(ytCheckboxes).forEach(function (key) {
    ytCheckboxes[key].addEventListener('change', function () {
        chrome.storage.local.get(defaults, function (data) {
            if (!data.sites) data.sites = defaults.sites;
            data.sites.youtube[key] = ytCheckboxes[key].checked;
            chrome.storage.local.set({ sites: data.sites });
        });
    });
});

Object.keys(rdCheckboxes).forEach(function (key) {
    rdCheckboxes[key].addEventListener('change', function () {
        chrome.storage.local.get(defaults, function (data) {
            if (!data.sites) data.sites = defaults.sites;
            data.sites.reddit[key] = rdCheckboxes[key].checked;
            chrome.storage.local.set({ sites: data.sites });
        });
    });
});
