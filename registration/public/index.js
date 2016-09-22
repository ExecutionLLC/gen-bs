document.addEventListener('DOMContentLoaded', onDocumentLoad, false);

function ajaxAsync(method, url, data) {
    return new Promise((resolve, reject) => {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.open(method, url);
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
    getUserForRegcodeEmailAsync(regcode, email) {
        return ajaxAsync('POST', 'http://localhost:3000/get_user_for_regcode_email', {regcode, email})
    },
    getUserForId(userId) {
        return ajaxAsync('post', 'http://localhost:3000/register', userId)
    },
    updateUser(user) {
        return ajaxAsync('post', 'http://localhost:3000/update_user', user)
    },
    createUser(regcode, email, user) {
        return ajaxAsync('post', 'http://localhost:3000/create_user', {regcode, email, user})
    }
};

const USER_INFO_SCHEME = [
    {
        id: 'email',
        label: 'Email'
    },
    {
        id: 'firstName',
        label: 'First name'
    },
    {
        id: 'lastName',
        label: 'Last name'
    },
    {
        id: 'speciality',
        label: 'Speciality'
    }
];

const DOMUtils = {
    removeAllChildren(el) {
        while(el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },
    setElementText(el, text) {
        DOMUtils.removeAllChildren(el);
        el.appendChild(document.createTextNode(text));
    },
    onInput(el, handler) {
        el.addEventListener('input', () => handler(el.value));
    }
};

const MakeLayout = {
    makeTemplateIds(templateEl, idSuffix) {
        const TEMPLATE_ID_ATTR = 'data-id';
        if (templateEl.hasAttribute(TEMPLATE_ID_ATTR)) {
            templateEl.id = templateEl.getAttribute(TEMPLATE_ID_ATTR) + '-' + idSuffix;
            templateEl.removeAttribute(TEMPLATE_ID_ATTR);
        }
        let childEl = templateEl.firstElementChild;
        while (childEl) {
            MakeLayout.makeTemplateIds(childEl, idSuffix);
            childEl = childEl.nextElementSibling;
        }
    },
    getTemplate(containerEl) {
        const templateEl = containerEl.querySelector('*[data-role=template]').cloneNode(true);
        if (templateEl) {
            templateEl.removeAttribute('data-role');
        }
        return templateEl;
    },
    getLabelElId(id) {
        return `userinfo-label-${id}`;
    },
    getValueElId(id) {
        return `userinfo-value-${id}`;
    },
    makeUserInfo(scheme, containerEl, templateEl, onChange) {
        scheme.forEach((scheme) => {
            const newEl = templateEl.cloneNode(true);
            MakeLayout.makeTemplateIds(newEl, scheme.id);
            containerEl.appendChild(newEl);
            const labelEl = document.getElementById(MakeLayout.getLabelElId(scheme.id));
            if (labelEl) {
                DOMUtils.setElementText(labelEl, scheme.label);
            }
            const inputEl = document.getElementById(MakeLayout.getValueElId(scheme.id));
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
    fillDataItem(id, data) {
        const el = document.getElementById(id);
        if (el) {
            FillData.fillDataItemEl(el, data);
        }
    },
    fillUserItem(scheme, data) {
        scheme.forEach(({id}) => {
            const inputEl = document.getElementById(MakeLayout.getValueElId(id));
            if (inputEl) {
                FillData.fillDataItemEl(inputEl, data && data[id] || '');
            }
        });
    }
};


var loadedUserId = null;
var currentUser = {
    regcode: '',
    email: '',
    user: {}
};

var checkingUser = {
    requested: {
        regcode: '',
        email: ''
    },
    requestRegcodeEmailAsync(regcode, email) {
        checkingUser.requested = {
            regcode,
            email
        };
        return API.getUserForRegcodeEmailAsync(regcode, email)
            .then((user) => {
                if (regcode !== checkingUser.requested.regcode || email !== checkingUser.requested.email) {
                    throw new Error('old request');
                }
                if (!user) {
                    throw new Error('User for ' + regcode + '/' + email + ' not found');
                }
                console.log('Logged in as ', user);
                return user;
            })
    }
};

function checkRegcodeEmail(regcode, email) {
    checkingUser.requestRegcodeEmailAsync(regcode, email)
        .then((user) => {
            loadedUserId = user.id;
            currentUser.user = Object.assign({}, user);
            currentUser.regcode = checkingUser.requested.regcode;
            currentUser.email = checkingUser.requested.email;
            FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
        })
        .catch(() => {
            loadedUserId = null;
            currentUser.user = {};
            FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
        });
}

function onUserEdit(fieldId, str) {
    console.log(currentUser);
    currentUser.user[fieldId] = str;
    if (!loadedUserId) {
        API.createUser(currentUser.regcode, currentUser.email, currentUser.user)
            .then((createdUser) => {
                loadedUserId = createdUser.id;
                currentUser.user = Object.assign({}, {id: loadedUserId}, currentUser.user);
                FillData.fillUserItem(USER_INFO_SCHEME, currentUser.user);
            });
    } else {
        API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId}));
    }
}

function onDocumentLoad() {
    const regcodeEl = document.getElementById('regcode');
    if (regcodeEl) {
        DOMUtils.onInput(regcodeEl, (regcode) => {currentUser.regcode = regcode; checkRegcodeEmail(regcode, null);});
    }
    const emailEl = document.getElementById('email');
    if (emailEl) {
        DOMUtils.onInput(emailEl, (email) => {currentUser.email = email; checkRegcodeEmail(null, email);});
    }
    const userInfoEl = document.getElementById('userinfo');
    const templateUserdataEl = MakeLayout.getTemplate(userInfoEl);
    if (templateUserdataEl) {
        MakeLayout.makeUserInfo(USER_INFO_SCHEME, userInfoEl, templateUserdataEl, onUserEdit);
        FillData.fillUserItem(USER_INFO_SCHEME, null);
    }

}