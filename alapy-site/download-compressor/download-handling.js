var elDownloadWindowsContainer = document.getElementById('download-windows-container');
var elDownloadLinuxContainer = document.getElementById('download-linux-container');
var elDownloadMacContainer = document.getElementById('download-mac-container');
var elDisclaimerContainer = document.getElementById('Disclaimer-container');
var elAcceptCheck = document.getElementById('accept-disclaimer');

elDownloadWindowsContainer.style.display = 'none';
elDownloadLinuxContainer.style.display = 'none';
elDownloadMacContainer.style.display = 'none';
elDisclaimerContainer.style.display = 'none';

var status1 = {
    downloadButton: null,
    accepted: false
};

function showStatus() {
    elDisclaimerContainer.style.display = status1.downloadButton ? '' : 'none';
    elDownloadWindowsContainer.style.display = 'none';
    elDownloadLinuxContainer.style.display = 'none';
    elDownloadMacContainer.style.display = 'none';
    if (status1.accepted && status1.downloadButton) {
        status1.downloadButton.style.display = '';
    }
}

showStatus();

function nearestParentWithClassName(el, reClass) {
    if (!el) {
        return el;
    }
    if (el.className && reClass.test(el.className)) {
        return el;
    }
    return nearestParentWithClassName(el.parentNode, reClass);
}

document.addEventListener('click', function(e) {
    var reClass = /(?:^|\s)download-button-(\w+)(?:\s|$)/;
    var el = nearestParentWithClassName(e.target, reClass);
    if (el) {
        var os = el.className.match(reClass);
        if (os) {
            var btn = ({
                'windows': elDownloadWindowsContainer,
                'linux': elDownloadLinuxContainer,
                'mac': elDownloadMacContainer
            })[os[1]];
            status1.downloadButton = btn;
            showStatus();
        }
        e.preventDefault();
    }
});

elAcceptCheck.addEventListener('click', function(e) {
    status1.accepted = e.target.checked;
    showStatus();
    e.stopPropagation();
});
