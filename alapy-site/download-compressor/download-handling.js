function onloadCallback() {
  grecaptcha.render('reCaptchaLock_2478', {'sitekey' : '6Ldi_xoUAAAAAJFf3X5EUxicvT-91FtsCP6vSojE', 'callback': function() { window.verifyCallback_2478(); }});
  grecaptcha.render('reCaptchaLock_2508', {'sitekey' : '6Ldi_xoUAAAAAJFf3X5EUxicvT-91FtsCP6vSojE', 'callback': function() { window.verifyCallback_2508(); }});
  grecaptcha.render('reCaptchaLock_2626', {'sitekey' : '6Ldi_xoUAAAAAJFf3X5EUxicvT-91FtsCP6vSojE', 'callback': function() { window.verifyCallback_2626(); }});
}

var elDownloadWindowsContainer = document.getElementById('download-windows-container');
var elDownloadLinuxContainer = document.getElementById('download-linux-container');
var elDownloadMacContainer = document.getElementById('download-mac-container');
var elDisclaimerContainer = document.getElementById('Disclaimer-container');
var elAcceptCheck = document.getElementById('accept-disclaimer');

var status1 = {
    selectedOSButtonPrev: null,
    selectedOSButton: null,
    downloadButton: null,
    accepted: false
};

function showStatus() {
    if (elDisclaimerContainer) {
        elDisclaimerContainer.style.display = status1.downloadButton ? '' : 'none';
    }
    if (elDownloadWindowsContainer) {
        elDownloadWindowsContainer.style.display = 'none';
    }
    if (elDownloadLinuxContainer) {
        elDownloadLinuxContainer.style.display = 'none';
    }
    if (elDownloadMacContainer) {
        elDownloadMacContainer.style.display = 'none';
    }
    if (status1.accepted && status1.downloadButton) {
        status1.downloadButton.style.display = '';
    }
    if (status1.selectedOSButtonPrev) {
        status1.selectedOSButtonPrev.classList.remove('active');
    }
    if (status1.selectedOSButton) {
        status1.selectedOSButton.classList.add('active');
        status1.selectedOSButtonPrev = status1.selectedOSButton;
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
            status1.selectedOSButton = el;
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
