const WEBSERVER = 'localhost';

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
        return ajaxAsync('GET', `http://${WEBSERVER}:3000/user`, {regcode, email: null});
    },
    getUserForRegcodeId(regcodeId) {
        return ajaxAsync('GET', `http://${WEBSERVER}:3000/user`, {regcodeId});
    },
    updateUser(user) {
        return ajaxAsync('PUT', `http://${WEBSERVER}:3000/user`, null, user);
    },
    requestUser(user) {
        return ajaxAsync('POST', `http://${WEBSERVER}:3000/user_request`, null, user);
    },
    registerUser(user) {
        return ajaxAsync('POST', `http://${WEBSERVER}:3000/register`, null, user);
    },
};

const USER_INFO_SCHEME = [
    {
        id: 'email',
        elementId: 'email-value'
    },
    {
        id: 'firstName',
        elementId: 'first-name-value'
    },
    {
        id: 'lastName',
        elementId: 'last-name-value'
    },
    {
        id: 'speciality',
        elementId: 'speciality-value'
    },
    {
        id: 'company',
        elementId: 'company-value'
    },
    {
        id: 'telephone',
        elementId: 'phone-value'
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
                radioEls.forEach((el) => {
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
                radioEls.forEach((el) => {
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
                radioEls.forEach((el) => {
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
        window.location.assign(`http://${WEBSERVER}:80/`);
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

function checkRegcode(regcode) {
    currentUser.regcode = regcode;
    checkingUser.requestRegcodeAsync(regcode)
        .then((user) =>
            onRegcodedUserReceived(user)
        )
        .catch(() =>
            displayNoUserInfo()
        );
}

function onUserEdit(fieldId, str) {
    console.log('onUserEdit', fieldId, str);
    console.log(currentUser);
    switchPageState({
        warningUserdata: false
    });
    currentUser.user[fieldId] = str;
    if (loadedUserId) {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}));
    }
}

function onSignupLoginPassword() {
    if (!validateUser()) {
        switchPageState({
            warningUserdata: true
        });
        return;
    }
    if (loadedUserId) {
        switchPageState({
            disableRegcode: true,
            disableUserInfo: true,
            showLoginType: false,
            showPassword: false,
            showRegister: false
        });
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}))
            .then(() => {
                switchPageState({
                    disableRegcode: true,
                    disableUserInfo: true,
                    showLoginType: false,
                    showPassword: true,
                    showRegister: true
                });
            });
    } else {
        switchPageState({
            disableRegcode: true,
            disableUserInfo: true,
            showLoginType: false,
            showPassword: true,
            showRegister: true
        });
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
    if (loadedUserId) {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}))
            .then(() => {
                switchPageState({
                    disableRegcode: true,
                    disableUserInfo: true,
                    showLoginType: false,
                    showPassword: true,
                    showRegister: true
                });
            });
    } else {
        switchPageState({
            disableRegcode: true,
            disableUserInfo: true,
            showLoginType: false,
            showPassword: true,
            showRegister: true
        });
    }
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
        showRegister: false
    });
    if (loadedUserId) {
        API.registerUser(Object.assign({}, currentUser.user, {password}));
    } else {
        API.requestUser(Object.assign({}, currentUser.user, {password}));
    }
}

var getPassword = null; // will be defined later

function onPassword(/*index, psw*/) {
    switchPageState({
        warningPassword: !getPassword()
    });2
}

function switchPageState(ops) {
    if (ops.disableRegcode != null) {
        const regcodeEl = document.getElementById('regcode');
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
}

function onDocumentLoad() {

    switchPageState({
        disableRegcode: true,
        disableUserInfo: true,
        showLoginType: false,
        showPassword: false,
        showRegister: false
    });

    const regcodeEl = document.getElementById('regcode');
    if (regcodeEl) {
        DOMUtils.onInput(regcodeEl, checkRegcode);
    }
    MakeLayout.attachHandlers(USER_INFO_SCHEME, onUserEdit);
    displayNoUserInfo();
    const signupLoginPassword = document.getElementById('signup-login-password');
    if (signupLoginPassword) {
        DOMUtils.onClick(signupLoginPassword, onSignupLoginPassword);
    }
    const signupGoogle = document.getElementById('signup-google');
    if (signupGoogle) {
        DOMUtils.onClick(signupGoogle, onSignupGoogle);
    }
    const registerButtonEl = document.getElementById('register');
    if (registerButtonEl) {
        DOMUtils.onClick(registerButtonEl, onRegister);
    }
    const passwordInputEls = ['password1-value', 'password2-value'].map((id, index) => {
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
                    showRegister: false
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