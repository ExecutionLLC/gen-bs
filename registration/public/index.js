const WEBSERVER = '37.195.64.171';
const WEBSERVER_API_PORT = '2030';
const WEBSERVER_HTTP_PORT = '2080';

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
                    reject(xmlhttp.statusText);
                }
            }
        };
        xmlhttp.send(JSON.stringify(data));
    });
}

const API = {
    getUserForRegcodeEmailAsync(regcode) {
        return ajaxAsync('GET', `http://${WEBSERVER}:${WEBSERVER_API_PORT}/user`, {regcode, email: null});
    },
    getUserForRegcodeId(regcodeId) {
        return ajaxAsync('GET', `http://${WEBSERVER}:${WEBSERVER_API_PORT}/user`, {regcodeId});
    },
    updateUser(user) {
        return ajaxAsync('PUT', `http://${WEBSERVER}:${WEBSERVER_API_PORT}/user`, null, user);
    },
    requestUser(user) {
        return ajaxAsync('POST', `http://${WEBSERVER}:${WEBSERVER_API_PORT}/user_request`, null, user);
    },
    registerUser(user) {
        return ajaxAsync('POST', `http://${WEBSERVER}:${WEBSERVER_API_PORT}/register`, null, user);
    },
};

const ELEMENT_ID = {
    regcodeInput: 'reg-code',
    signupLoginPasswordButton: 'reg-submit-log-pass',
    signupGoogleButton: 'reg-google',
    registerButton: 'reg-submit',
    passwordInputs: ['reg-password', 'reg-re-password'],
    registerFailMessage: 'register-fail-message'
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
        radioName: 'reg-gender'
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
        return API.getUserForRegcodeEmailAsync(regcode, null)
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

function onRegcodedUserReceived(user) {
    if (user.isActivated) {
        window.location.assign(`http://${WEBSERVER}:${WEBSERVER_HTTP_PORT}/`);
        return;
    }
    loadedUserId = user.id;
    currentUser.user = Object.assign({}, user);
    currentUser.regcode = checkingUser.requested.regcode;
    FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
    switchPageState({
        disableRegcode: true,
        disableUserInfo: false,
        showLoginType: true,
        showPassword: false,
        showRegister: false
    });
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
    checkingUser.requestRegcodeAsync(currentUser.regcode)
        .then((user) =>
            onRegcodedUserReceived(user)
        )
        .catch(() =>
            displayNoUserInfo()
        );
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
        warningPassword: true,
        showRegister: true
    });
    if (loadedUserId) {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}));
    }
}

function onSignupGoogle() {
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
        showPassword: false,
        showRegister: false
    });
    const registerAsync = loadedUserId ?
        API.registerUser(Object.assign({}, currentUser.user, {loginType: 'google'})) :
        API.requestUser(Object.assign({}, currentUser.user, {loginType: 'google'}));
    registerAsync
        .then(() => {
            if (loadedUserId) {
                window.location.assign(`http://${WEBSERVER}:${WEBSERVER_HTTP_PORT}/`);
            } else {
                switchPageState({loading: false, register: {mail: true}});
            }
        })
        .catch((err) => {
            const registerFailMessageEl = document.getElementById(ELEMENT_ID.registerFailMessage);
            if (registerFailMessageEl) {
                DOMUtils.setElementText(registerFailMessageEl, '' + err);
            }
            switchPageState({loading: false, register: {fail: true}});
        });
}

function validateUser() {
    const {email, firstName, lastName, company, telephone, gender, speciality} = currentUser.user;
    if (!email || !firstName || !lastName|| !speciality || !gender || !company || !telephone) {
        return false;
    }
    return true;
}

function onRegister() {
    const password = getPassword();
    if (password == null) {
        return;
    }
    switchPageState({
        disableRegcode: true,
        disableUserInfo: true,
        showLoginType: false,
        showPassword: false,
        showRegister: false,
        loading: true
    });
    const registerAsync = loadedUserId ?
        API.registerUser(Object.assign({}, currentUser.user, {loginType: 'password', password})) :
        API.requestUser(Object.assign({}, currentUser.user, {loginType: 'password', password}));
    registerAsync
        .then(() => {
            if (loadedUserId) {
                window.location.assign(`http://${WEBSERVER}:${WEBSERVER_HTTP_PORT}/`);
            } else {
                switchPageState({loading: false, register: {mail: true}});
            }
        })
        .catch((err) => {
            const registerFailMessageEl = document.getElementById(ELEMENT_ID.registerFailMessage);
            if (registerFailMessageEl) {
                DOMUtils.setElementText(registerFailMessageEl, '' + err);
            }
            switchPageState({loading: false, register: {fail: true}});
        });
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
        document.body.classList.toggle('no-login-type', !ops.showLoginType)
    }
    if (ops.showPassword != null) {
        document.body.classList.toggle('no-password', !ops.showPassword)
    }
    if (ops.showRegister != null) {
        document.body.classList.toggle('no-register', !ops.showRegister)
    }
    if (ops.warningUserdata != null) {
        document.body.classList.toggle('warning-userdata', ops.warningUserdata)
    }
    if (ops.warningPassword != null) {
        document.body.classList.toggle('warning-password', ops.warningPassword)
    }
    if (ops.loading != null) {
        document.body.classList.toggle('register-loading', ops.loading)
    }
    if (ops.register != null) {
        document.body.classList.toggle('register-ok-mail', !!ops.register.mail);
        document.body.classList.toggle('register-fail', !!ops.register.fail);
    }
}

function onDocumentLoad() {

    switchPageState({
        disableRegcode: true,
        disableUserInfo: true,
        showLoginType: false,
        showPassword: false,
        showRegister: false
    });

    const regcodeEl = document.getElementById(ELEMENT_ID.regcodeInput);
    if (regcodeEl) {
        DOMUtils.onInput(regcodeEl, checkRegcode);
    }
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