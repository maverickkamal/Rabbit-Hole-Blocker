var toggle = document.getElementById('toggle');
var statusEl = document.getElementById('status');
var ytToggle = document.getElementById('toggle-youtube');
var rdToggle = document.getElementById('toggle-reddit');
var ytRow = document.getElementById('youtube-row');
var rdRow = document.getElementById('reddit-row');
var ytElements = document.getElementById('youtube-elements');
var rdElements = document.getElementById('reddit-elements');
var sessionTimeEl = document.getElementById('session-time');
var todayTimeEl = document.getElementById('today-time');
var streakCountEl = document.getElementById('streak-count');
var breakBtn = document.getElementById('break-btn');
var breakPresets = document.getElementById('break-presets');
var breakActive = document.getElementById('break-active');
var breakCountdown = document.getElementById('break-countdown');
var breakProgress = document.getElementById('break-progress');
var breakRabbit = document.getElementById('break-rabbit');
var breakCancel = document.getElementById('break-cancel');
var breakSection = document.getElementById('break-section');

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
    },
    focus: { sessionStart: null, todaySeconds: 0, streak: 0, lastDate: null },
    breakUntil: null,
    breakDuration: null
};

var timerInterval = null;
var breakInterval = null;
var presetsVisible = false;

function formatTime(totalSeconds) {
    var h = Math.floor(totalSeconds / 3600);
    var m = Math.floor((totalSeconds % 3600) / 60);
    var s = totalSeconds % 60;
    if (h > 0) return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    return m + ':' + String(s).padStart(2, '0');
}

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

function startSessionTimer(sessionStart, todaySeconds) {
    if (timerInterval) clearInterval(timerInterval);
    function tick() {
        var elapsed = Math.floor((Date.now() - sessionStart) / 1000);
        sessionTimeEl.textContent = formatTime(elapsed);
        todayTimeEl.textContent = formatTime(todaySeconds + elapsed);
    }
    tick();
    timerInterval = setInterval(tick, 1000);
}

function stopSessionTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    sessionTimeEl.textContent = '0:00';
}

function updateFocusUI(focus) {
    if (!focus) focus = defaults.focus;
    streakCountEl.textContent = focus.streak || 0;
    todayTimeEl.textContent = formatTime(focus.todaySeconds || 0);
    if (focus.sessionStart) {
        startSessionTimer(focus.sessionStart, focus.todaySeconds || 0);
    } else {
        stopSessionTimer();
        todayTimeEl.textContent = formatTime(focus.todaySeconds || 0);
    }
}

function updateBreakUI(data) {
    var now = Date.now();
    if (data.breakUntil && data.breakUntil > now) {
        breakBtn.classList.add('hidden');
        breakPresets.classList.add('hidden');
        breakActive.classList.remove('hidden');
        breakSection.style.display = '';
        startBreakCountdown(data.breakUntil, data.breakDuration || 300000);
    } else {
        breakActive.classList.add('hidden');
        breakBtn.classList.remove('hidden');
        presetsVisible = false;
        breakPresets.classList.add('hidden');
        if (breakInterval) clearInterval(breakInterval);
        breakSection.style.display = data.enabled ? '' : 'none';
    }
}

function startBreakCountdown(breakUntil, totalDuration) {
    if (breakInterval) clearInterval(breakInterval);
    function tick() {
        var remaining = Math.max(0, breakUntil - Date.now());
        var remainingSec = Math.ceil(remaining / 1000);
        breakCountdown.textContent = formatTime(remainingSec);
        var elapsed = totalDuration - remaining;
        var pct = Math.min(100, (elapsed / totalDuration) * 100);
        breakProgress.style.width = pct + '%';
        breakRabbit.style.left = pct + '%';
        if (remaining <= 0) {
            clearInterval(breakInterval);
            chrome.storage.local.get(defaults, function (d) {
                updateBreakUI(d);
            });
        }
    }
    tick();
    breakInterval = setInterval(tick, 1000);
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
    if (!data.focus) data.focus = defaults.focus;
    updateMasterUI(data.enabled);
    updateSiteUI(data);
    updateFocusUI(data.focus);
    updateBreakUI(data);
});

toggle.addEventListener('change', function () {
    var enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateMasterUI(enabled);
    breakSection.style.display = enabled ? '' : 'none';
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

breakBtn.addEventListener('click', function () {
    presetsVisible = !presetsVisible;
    breakPresets.classList.toggle('hidden', !presetsVisible);
});

document.querySelectorAll('.preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var minutes = parseInt(btn.dataset.minutes);
        var duration = minutes * 60 * 1000;
        var breakUntil = Date.now() + duration;
        chrome.storage.local.set({
            enabled: false,
            breakUntil: breakUntil,
            breakDuration: duration
        });
        updateMasterUI(false);
        breakBtn.classList.add('hidden');
        breakPresets.classList.add('hidden');
        breakActive.classList.remove('hidden');
        startBreakCountdown(breakUntil, duration);
    });
});

breakCancel.addEventListener('click', function () {
    chrome.storage.local.set({
        enabled: true,
        breakUntil: null,
        breakDuration: null
    });
    updateMasterUI(true);
    if (breakInterval) clearInterval(breakInterval);
    breakActive.classList.add('hidden');
    breakBtn.classList.remove('hidden');
    breakSection.style.display = '';
});
