const REGSERVER_API_BASE_URL = 'https://alpha.genomics-exe.com/register';
const GENOMICS_URL = 'http://alpha.genomics-exe.com/';

document.addEventListener('DOMContentLoaded', onDocumentLoad, false);

function makeURIParams(params) {
    var result = [];
    var key;
    for (key in params) {
        if (!params.hasOwnProperty(key)) {
            continue;
        }
        result.push(`${encodeURIComponent(key)}=${encodeURIComponent(params[key] || '')}`)
    }
    return result.join('&');
}

function ajaxAsync(method, url, params, data) {
    return new Promise((resolve, reject) => {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.open(method, url + (params ? '?' + makeURIParams(params) : ''));
        xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xmlhttp.onreadystatechange = () => {
            if (xmlhttp.readyState === xmlhttp.DONE) {
                if (xmlhttp.status === 200) {
                    try {
                        resolve(JSON.parse(xmlhttp.responseText));
                    } catch(e) {
                        reject('Not a JSON answer');
                    }
                } else {
                    reject(xmlhttp.response || xmlhttp.statusText);
                }
            }
        };
        xmlhttp.send(JSON.stringify(data));
    });
}

const API = {
    getUserForRegcodeAsync(regcode) {
        return ajaxAsync('GET', `${REGSERVER_API_BASE_URL}/user`, {regcode, email: null});
    },
    getUserForRegcodeId(regcodeId) {
        return ajaxAsync('GET', `${REGSERVER_API_BASE_URL}/user`, {regcodeId});
    },
    updateUser(user) {
        return ajaxAsync('PUT', `${REGSERVER_API_BASE_URL}/user`, null, user);
    },
    requestUser(user) {
        return ajaxAsync('POST', `${REGSERVER_API_BASE_URL}/user_request`, null, user);
    },
    registerUser(user) {
        return ajaxAsync('POST', `${REGSERVER_API_BASE_URL}/register`, null, user);
    }
};

const ELEMENT_ID = {
    regcodeInput: 'reg-code',
    signupLoginPasswordButton: 'reg-submit-log-pass',
    signupGoogleButton: 'reg-google',
    registerButton: 'reg-submit',
    passwordInputs: ['reg-password', 'reg-re-password'],
    registerFailMessage: 'register-fail-message',
    acceptDisclaimer: 'accept-disclaimer',
    applicationLink: 'reg-application-link'
};

const USER_INFO_SCHEME = [
    {
        id: 'email',
        elementId: 'reg-e-mail'
    },
    {
        id: 'firstName',
        elementId: 'reg-first-name'
    },
    {
        id: 'lastName',
        elementId: 'reg-last-name'
    },
    {
        id: 'speciality',
        elementId: 'reg-speciality'
    },
    {
        id: 'company',
        elementId: 'reg-company'
    },
    {
        id: 'telephone',
        elementId: 'reg-telephone'
    },
    {
        id: 'gender',
        radioName: 'reg-gender',
        containerId: 'reg-gender'
    }
];

const DOMUtils = {
    removeAllChildren(el) {
        while(el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },
    setElementText(el, text) {
        this.removeAllChildren(el);
        el.appendChild(document.createTextNode(text));
    },
    onInput(el, handler) {
        el.addEventListener('input', () => handler(el.value));
    },
    onClick(el, handler) {
        if (el.getAttribute('type') === 'submit') {
            el.setAttribute('type', 'button');
        }
        el.addEventListener('click', () => handler());
    }
};

const MakeLayout = {
    attachHandlers(scheme, onChange) {
        scheme.forEach((scheme) => {
            const inputEl = scheme.elementId && document.getElementById(scheme.elementId);
            if (inputEl) {
                DOMUtils.onInput(inputEl, (str) => onChange(scheme.id, str))
            }
            const radioEls = scheme.radioName && document.getElementsByName(scheme.radioName);
            if (radioEls && radioEls.length) {
                Array.prototype.slice.call(radioEls).forEach((el) => {
                    DOMUtils.onClick(el, () => onChange(scheme.id, el.value))
                });
            }
        });
    },
    disableControls(scheme, disable) {
        scheme.forEach((scheme) => {
            const inputEl = scheme.elementId && document.getElementById(scheme.elementId);
            if (inputEl) {
                inputEl.disabled = disable;
            }
            const radioEls = scheme.radioName && document.getElementsByName(scheme.radioName);
            if (radioEls && radioEls.length) {
                Array.prototype.slice.call(radioEls).forEach((el) => {
                    el.disabled = disable;
                });
            }
        });
    },
    toggleRequiredAlert(inputEl, showAlert) {
        const nextEl = inputEl.nextElementSibling;
        if (nextEl && nextEl.getAttribute('role') === 'alert') {
            if (showAlert) {
                return;
            } else {
                nextEl.parentNode.removeChild(nextEl);
            }
        }
        if (showAlert) {
            const el = document.createElement('span');
            el.classList.add('wpcf7-not-valid-tip');
            el.setAttribute('role', 'alert');
            DOMUtils.setElementText(el, 'The field is required.');
            inputEl.parentNode.insertBefore(el, inputEl.nextElementSibling);
        }
    },
    disableAutocomplete(ids) {
        ids.forEach((id) => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('autocomplete', 'off');
            }
        });
    }
};

const FillData = {
    fillDataItemEl(el, data) {
        if (typeof el.value !== 'undefined') {
            el.value = data;
        } else {
            el.textContent = data;
        }
    },
    fillUserItem(scheme, data) {
        scheme.forEach((scheme) => {
            const inputEl = scheme.elementId && document.getElementById(scheme.elementId);
            if (inputEl) {
                FillData.fillDataItemEl(inputEl, data[scheme.id] || '');
            }
            const radioEls = scheme.radioName && document.getElementsByName(scheme.radioName);
            if (radioEls && radioEls.length) {
                Array.prototype.slice.call(radioEls).forEach((el) => {
                    el.checked = el.value === data[scheme.id];
                });
            }
        });
    }
};


var loadedUserId = null;
var currentUser = {
    regcode: '',
    user: {}
};

const checkingUser = {
    requested: {
        regcode: ''
    },
    requestRegcodeAsync(regcode) {
        checkingUser.requested = {
            regcode
        };
        return API.getUserForRegcodeAsync(regcode)
            .then((user) => {
                if (regcode !== checkingUser.requested.regcode) {
                    throw new Error('old request');
                }
                if (!user) {
                    throw new Error('User for ' + regcode + ' not found');
                }
                console.log('Logged in as ', user);
                return user;
            })
    }
};

function displayNoUserInfo() {
    loadedUserId = null;
    currentUser.user = {};
    FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
}

function showAppLink() {
    const linkEl = document.getElementById(ELEMENT_ID.applicationLink);
    if (linkEl) {
        linkEl.setAttribute('href', GENOMICS_URL);
    }
}

function onRegcodedUserReceived(user) {
    loadedUserId = user.id;
    currentUser.user = Object.assign({}, user);
    currentUser.regcode = checkingUser.requested.regcode;
    FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
    if (user.isActivated) {
        showAppLink();
        switchPageState({
            disableRegcode: true,
            disableUserInfo: true,
            showLoginType: false,
            showPassword: false,
            showRegister: false,
            showAppLink: true
        });
    } else {
        switchPageState({
            disableRegcode: true,
            disableUserInfo: false,
            showLoginType: true,
            showPassword: false,
            showRegister: false
        });
    }
}

function debounce(fn, delay) {
    var timer = null;
    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
}

const checkServerRegcode = debounce(() => {
    const regcode = currentUser.regcode;
    checkingUser.requestRegcodeAsync(regcode)
        .then((user) => {
            switchPageState({validRegcode: true, disableUserInfo: false, showLoginType: true});
            onRegcodedUserReceived(user);
        })
        .catch(() => {
            switchPageState({validRegcode: !regcode, disableUserInfo: !!regcode, showLoginType: !regcode});
        });
}, 200);

function checkRegcode(regcode) {
    currentUser.regcode = regcode;
    checkServerRegcode()
}

const updateServerData = debounce(() => API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId})), 200);

function onUserEdit (fieldId, str) {
    console.log('onUserEdit', fieldId, str);
    console.log(currentUser);
    switchPageState({
        warningUserdata: false
    });
    currentUser.user[fieldId] = str;
    if (loadedUserId) {
        updateServerData();
    }
}

function onSignupLoginPassword() {
    if (loadedUserId) {
        updateServerData();
    }
    if (!validateUser()) {
        switchPageState({
            warningUserdata: true
        });
        return;
    }
    switchPageState({
        disableRegcode: true,
        disableUserInfo: true,
        showLoginType: false,
        showPassword: true,
        warningPassword: false,
        showRegister: true
    });
}

function addUser(loginInfo) {
    switchPageState({
        showLoginType: false,
        showPassword: false,
        showRegister: false,
        loading: true
    });
    const registerAsync = loadedUserId ?
        API.registerUser(Object.assign({}, currentUser.user, loginInfo)) :
        API.requestUser(Object.assign({}, currentUser.user, loginInfo));
    registerAsync
        .then(() => {
            if (loadedUserId) {
                showAppLink();
                switchPageState({
                    loading: false,
                    disableRegcode: true,
                    disableUserInfo: true,
                    showLoginType: false,
                    showPassword: false,
                    showRegister: false,
                    showAppLink: true
                });
            } else {
                switchPageState({
                    loading: false,
                    register: {mail: true}
                });
            }
        })
        .catch((err) => {
            const registerFailMessageEl = document.getElementById(ELEMENT_ID.registerFailMessage);
            if (registerFailMessageEl) {
                DOMUtils.setElementText(registerFailMessageEl, '' + err);
            }
            switchPageState({
                disableUserInfo: false,
                showLoginType: true,
                showPassword: false,
                showRegister: false,
                loading: false,
                register: {fail: true}
            });
        });
}

function onSignupGoogle() {
    if (loadedUserId) {
        updateServerData();
    }
    if (!validateUser()) {
        switchPageState({
            warningUserdata: true
        });
        return;
    }
    addUser({loginType: 'google'});
}

function validateUser() {

    const hasAbsent = USER_INFO_SCHEME.reduce((hasAbsent, scheme) => {
        const inputEl = scheme.containerId ?
            document.getElementById(scheme.containerId) :
            document.getElementById(scheme.elementId);
        const isAbsent = !currentUser.user[scheme.id];
        if (inputEl) {
            MakeLayout.toggleRequiredAlert(inputEl, isAbsent);
        }
        return hasAbsent || isAbsent;
    }, false);
    return !hasAbsent;
}

function onRegister() {
    const password = getPassword();
    if (!password) {
        switchPageState({
            warningPassword: true
        });
        return;
    }
    addUser({loginType: 'password', password});
}

var getPassword = null; // will be defined later

function onPassword(/*index, psw*/) {
    switchPageState({
        warningPassword: !getPassword()
    });
}

function switchPageState(ops) {
    if (ops.disableRegcode != null) {
        const regcodeEl = document.getElementById(ELEMENT_ID.regcodeInput);
        if (regcodeEl) {
            regcodeEl.disabled = ops.disableRegcode;
        }
    }
    if (ops.disableUserInfo != null) {
        MakeLayout.disableControls(USER_INFO_SCHEME, ops.disableUserInfo);
    }
    if (ops.showLoginType != null) {
        document.body.classList.toggle('no-login-type', !ops.showLoginType);
    }
    if (ops.showPassword != null) {
        document.body.classList.toggle('no-password', !ops.showPassword);
    }
    if (ops.showRegister != null) {
        document.body.classList.toggle('no-register', !ops.showRegister);
    }
    if (ops.warningUserdata != null) {
        document.body.classList.toggle('warning-userdata', ops.warningUserdata);
    }
    if (ops.warningPassword != null) {
        document.body.classList.toggle('warning-password', ops.warningPassword);
    }
    if (ops.loading != null) {
        document.body.classList.toggle('register-loading', ops.loading);
    }
    if (ops.register != null) {
        document.body.classList.toggle('register-ok-mail', !!ops.register.mail);
        document.body.classList.toggle('register-fail', !!ops.register.fail);
    }
    if (ops.validRegcode != null) {
        document.body.classList.toggle('valid-regcode', ops.validRegcode);
    }
    if (ops.showAppLink) {
        document.body.classList.toggle('show-app-link', ops.validRegcode);
    }
}


class SubmitButtons {
    constructor(buttons) {
        this._disclaimerAccepted = false;
        this._reCaptchaSuccess = false;
        this._buttons = buttons.slice();
        this._onChanged();
    }

    _onChanged() {

        const enable = this._disclaimerAccepted && this._reCaptchaSuccess;

        const toggleAttribute = enable ?
            (el) => el.removeAttribute('disabled') :
            (el) => el.setAttribute('disabled', 'disabled');

        function setDisable(el) {
            if (el) {
                toggleAttribute(el);
            }
        }

        this._buttons.forEach((el) => setDisable(el));
    }

    onDisclaimerAcceptedChange(accept) {
        this._disclaimerAccepted = accept;
        this._onChanged();
    }

    onReCaptchaResultChange(success) {
        this._reCaptchaSuccess = success;
        this._onChanged();
    }
}

var submitButtons = null;

function onDocumentLoad() {

    switchPageState({
        validRegcode: true,
        disableRegcode: true,
        disableUserInfo: true,
        showLoginType: false,
        showPassword: false,
        showRegister: false,
        showAppLink: false
    });

    const regcodeEl = document.getElementById(ELEMENT_ID.regcodeInput);
    if (regcodeEl) {
        DOMUtils.onInput(regcodeEl, checkRegcode);
    }
    MakeLayout.disableAutocomplete(
        USER_INFO_SCHEME.map((scheme) => scheme.elementId)
            .concat([ELEMENT_ID.regcodeInput])
    );
    MakeLayout.attachHandlers(USER_INFO_SCHEME, onUserEdit);
    displayNoUserInfo();
    const signupLoginPassword = document.getElementById(ELEMENT_ID.signupLoginPasswordButton);
    if (signupLoginPassword) {
        DOMUtils.onClick(signupLoginPassword, onSignupLoginPassword);
    }
    const signupGoogle = document.getElementById(ELEMENT_ID.signupGoogleButton);
    if (signupGoogle) {
        DOMUtils.onClick(signupGoogle, onSignupGoogle);
    }
    const registerButtonEl = document.getElementById(ELEMENT_ID.registerButton);
    if (registerButtonEl) {
        DOMUtils.onClick(registerButtonEl, onRegister);
    }
    const passwordInputEls = ELEMENT_ID.passwordInputs.map((id, index) => {
        const passwordInputEl = document.getElementById(id);
        if (passwordInputEl) {
            DOMUtils.onInput(passwordInputEl, (psw) => onPassword(index, psw));
        }
        return passwordInputEl;
    });

    submitButtons = new SubmitButtons([registerButtonEl, signupLoginPassword, signupGoogle].filter(el => !!el));

    const acceptDisclaimerEl = document.getElementById(ELEMENT_ID.acceptDisclaimer);
    if (acceptDisclaimerEl) {
        DOMUtils.onClick(acceptDisclaimerEl, () => submitButtons.onDisclaimerAcceptedChange(acceptDisclaimerEl.checked));
    }

    getPassword = () => {
        return passwordInputEls.reduce(
            (psw, el, index) => {
                if (!index) {
                    return el.value;
                }
                if (el.value === psw) {
                    return psw;
                } else {
                    return null;
                }
            },
            null
        );
    };

    const regcodeId = window.location.hash.replace(/^#/, '');
    if (regcodeId) {
        switchPageState({loading: true});
        API.getUserForRegcodeId(regcodeId)
            .then((user) => {
                if (regcodeEl) {
                    regcodeEl.value = user.regcode;
                }
                switchPageState({
                    disableRegcode: true,
                    disableUserInfo: false,
                    showLoginType: true,
                    showPassword: false,
                    showRegister: false,
                    loading: false
                });
                onRegcodedUserReceived(user);
            })
            .catch(() => {
                displayNoUserInfo();
            });
    } else {
        switchPageState({
            disableRegcode: false,
            disableUserInfo: false,
            showLoginType: true,
            showPassword: false,
            showRegister: false
        });
    }
}

function checkReCaptchaAsync(reCaptchaResponse) {
    return ajaxAsync('POST', 'http://37.195.64.171:2030/recaptcha', null, {reCaptchaResponse});
}

var reCaptchaResponse = null;

function reCaptchaCallback(response) {
    reCaptchaResponse = response;
    console.log('reCaptchaCallback', reCaptchaResponse);
    checkReCaptchaAsync(reCaptchaResponse)
        .then((res) => {
            console.log('reCaptcha result', res);
            submitButtons.onReCaptchaResultChange(res && res.success);
        })
        .catch((err) => {
            console.log('reCaptcha error', err);
            submitButtons.onReCaptchaResultChange(false);
        });
}
