const toggle = document.getElementById('toggle');
const status = document.getElementById('status');

function updateUI(enabled) {
    toggle.checked = enabled;
    status.textContent = enabled ? 'Enabled' : 'Disabled';
    status.className = 'status ' + (enabled ? 'on' : 'off');
}

chrome.storage.local.get({ enabled: true }, function (data) {
    updateUI(data.enabled);
});

toggle.addEventListener('change', function () {
    const enabled = toggle.checked;
    chrome.storage.local.set({ enabled: enabled });
    updateUI(enabled);
});
