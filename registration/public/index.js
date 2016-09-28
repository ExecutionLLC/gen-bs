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
        return ajaxAsync('GET', 'http://localhost:3000/user', {regcode, email: null});
    },
    getUserForRegcodeId(regcodeId) {
        return ajaxAsync('GET', 'http://localhost:3000/user', {regcodeId});
    },
    updateUser(user) {
        return ajaxAsync('PUT', 'http://localhost:3000/user', null, user);
    },
    requestUser(user) {
        return ajaxAsync('POST', 'http://localhost:3000/user_request', null, user);
    }
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
            console.log('qqq', scheme);
            const inputEl = document.getElementById(scheme.elementId);
            if (inputEl) {
                DOMUtils.onInput(inputEl, (str) => onChange(scheme.id, str))
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
            const inputEl = document.getElementById(scheme.elementId);
            if (inputEl) {
                FillData.fillDataItemEl(inputEl, data[scheme.id] || '');
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

function checkRegcode(regcode) {
    currentUser.regcode = regcode;
    checkingUser.requestRegcodeAsync(regcode)
        .then((user) => {
            loadedUserId = user.id;
            currentUser.user = Object.assign({}, user);
            currentUser.regcode = checkingUser.requested.regcode;
            FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
        })
        .catch(() => {
            displayNoUserInfo();
        });
}

function onUserEdit(fieldId, str) {
    console.log('onUserEdit', fieldId, str);
    console.log(currentUser);
    currentUser.user[fieldId] = str;
    if (loadedUserId) {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}));
    }
}

function onSignupLoginPassword() {
    if (loadedUserId) {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}));
    }
}

function onSignupGoogle() {
    if (loadedUserId) {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}));
    }
}

function onRegister() {
    if (!loadedUserId) {
        API.requestUser(currentUser.user);
    }
}

function onDocumentLoad() {
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
    const regcodeId = window.location.hash.replace(/^#/, '');
    if (regcodeId) {
        if (regcodeEl) {
            regcodeEl.disabled = true;
        }
        API.getUserForRegcodeId(regcodeId)
            .then((user) => {
                if (user.isActivated) {
                    window.location.assign('http://localhost:80/');
                    return;
                }
                loadedUserId = user.id;
                currentUser.user = Object.assign({}, user);
                currentUser.regcode = checkingUser.requested.regcode;
                FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
                if (regcodeEl) {
                    regcodeEl.value = user.regcode;
                }
            })
            .catch(() => {
                displayNoUserInfo();
            });
    }
}