document.body.classList.add('loading');
document.body.classList.add('register-loading');

(function(global){

//
// Check for native Promise and it has correct interface
//

var NativePromise = global['Promise'];
var nativePromiseSupported =
  NativePromise &&
  // Some of these methods are missing from
  // Firefox/Chrome experimental implementations
  'resolve' in NativePromise &&
  'reject' in NativePromise &&
  'all' in NativePromise &&
  'race' in NativePromise &&
  // Older version of the spec had a resolver object
  // as the arg rather than a function
  (function(){
    var resolve;
    new NativePromise(function(r){ resolve = r; });
    return typeof resolve === 'function';
  })();


//
// export if necessary
//

if (typeof exports !== 'undefined' && exports)
{
  // node.js
  exports.Promise = nativePromiseSupported ? NativePromise : Promise;
  exports.Polyfill = Promise;
}
else
{
  // AMD
  if (typeof define == 'function' && define.amd)
  {
    define(function(){
      return nativePromiseSupported ? NativePromise : Promise;
    });
  }
  else
  {
    // in browser add to global
    if (!nativePromiseSupported)
      global['Promise'] = Promise;
  }
}


//
// Polyfill
//

var PENDING = 'pending';
var SEALED = 'sealed';
var FULFILLED = 'fulfilled';
var REJECTED = 'rejected';
var NOOP = function(){};

function isArray(value) {
  return Object.prototype.toString.call(value) === '[object Array]';
}

// async calls
var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
var asyncQueue = [];
var asyncTimer;

function asyncFlush(){
  // run promise callbacks
  for (var i = 0; i < asyncQueue.length; i++)
    asyncQueue[i][0](asyncQueue[i][1]);

  // reset async asyncQueue
  asyncQueue = [];
  asyncTimer = false;
}

function asyncCall(callback, arg){
  asyncQueue.push([callback, arg]);

  if (!asyncTimer)
  {
    asyncTimer = true;
    asyncSetTimer(asyncFlush, 0);
  }
}


function invokeResolver(resolver, promise) {
  function resolvePromise(value) {
    resolve(promise, value);
  }

  function rejectPromise(reason) {
    reject(promise, reason);
  }

  try {
    resolver(resolvePromise, rejectPromise);
  } catch(e) {
    rejectPromise(e);
  }
}

function invokeCallback(subscriber){
  var owner = subscriber.owner;
  var settled = owner.state_;
  var value = owner.data_;  
  var callback = subscriber[settled];
  var promise = subscriber.then;

  if (typeof callback === 'function')
  {
    settled = FULFILLED;
    try {
      value = callback(value);
    } catch(e) {
      reject(promise, e);
    }
  }

  if (!handleThenable(promise, value))
  {
    if (settled === FULFILLED)
      resolve(promise, value);

    if (settled === REJECTED)
      reject(promise, value);
  }
}

function handleThenable(promise, value) {
  var resolved;

  try {
    if (promise === value)
      throw new TypeError('A promises callback cannot return that same promise.');

    if (value && (typeof value === 'function' || typeof value === 'object'))
    {
      var then = value.then;  // then should be retrived only once

      if (typeof then === 'function')
      {
        then.call(value, function(val){
          if (!resolved)
          {
            resolved = true;

            if (value !== val)
              resolve(promise, val);
            else
              fulfill(promise, val);
          }
        }, function(reason){
          if (!resolved)
          {
            resolved = true;

            reject(promise, reason);
          }
        });

        return true;
      }
    }
  } catch (e) {
    if (!resolved)
      reject(promise, e);

    return true;
  }

  return false;
}

function resolve(promise, value){
  if (promise === value || !handleThenable(promise, value))
    fulfill(promise, value);
}

function fulfill(promise, value){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = value;

    asyncCall(publishFulfillment, promise);
  }
}

function reject(promise, reason){
  if (promise.state_ === PENDING)
  {
    promise.state_ = SEALED;
    promise.data_ = reason;

    asyncCall(publishRejection, promise);
  }
}

function publish(promise) {
  var callbacks = promise.then_;
  promise.then_ = undefined;

  for (var i = 0; i < callbacks.length; i++) {
    invokeCallback(callbacks[i]);
  }
}

function publishFulfillment(promise){
  promise.state_ = FULFILLED;
  publish(promise);
}

function publishRejection(promise){
  promise.state_ = REJECTED;
  publish(promise);
}

/**
* @class
*/
function Promise(resolver){
  if (typeof resolver !== 'function')
    throw new TypeError('Promise constructor takes a function argument');

  if (this instanceof Promise === false)
    throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');

  this.then_ = [];

  invokeResolver(resolver, this);
}

Promise.prototype = {
  constructor: Promise,

  state_: PENDING,
  then_: null,
  data_: undefined,

  then: function(onFulfillment, onRejection){
    var subscriber = {
      owner: this,
      then: new this.constructor(NOOP),
      fulfilled: onFulfillment,
      rejected: onRejection
    };

    if (this.state_ === FULFILLED || this.state_ === REJECTED)
    {
      // already resolved, call callback async
      asyncCall(invokeCallback, subscriber);
    }
    else
    {
      // subscribe
      this.then_.push(subscriber);
    }

    return subscriber.then;
  },

  'catch': function(onRejection) {
    return this.then(null, onRejection);
  }
};

Promise.all = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.all().');

  return new Class(function(resolve, reject){
    var results = [];
    var remaining = 0;

    function resolver(index){
      remaining++;
      return function(value){
        results[index] = value;
        if (!--remaining)
          resolve(results);
      };
    }

    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolver(i), reject);
      else
        results[i] = promise;
    }

    if (!remaining)
      resolve(results);
  });
};

Promise.race = function(promises){
  var Class = this;

  if (!isArray(promises))
    throw new TypeError('You must pass an array to Promise.race().');

  return new Class(function(resolve, reject) {
    for (var i = 0, promise; i < promises.length; i++)
    {
      promise = promises[i];

      if (promise && typeof promise.then === 'function')
        promise.then(resolve, reject);
      else
        resolve(promise);
    }
  });
};

Promise.resolve = function(value){
  var Class = this;

  if (value && typeof value === 'object' && value.constructor === Class)
    return value;

  return new Class(function(resolve){
    resolve(value);
  });
};

Promise.reject = function(reason){
  var Class = this;

  return new Class(function(resolve, reject){
    reject(reason);
  });
};

})(typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : typeof self != 'undefined' ? self : this);

const REGSERVER_API_BASE_URL = 'https://agx.alapy.com/register';
const GENOMICS_URL = 'https://agx.alapy.com/';

document.addEventListener('DOMContentLoaded', onDocumentLoad, false);

function makeURIParams(params) {
    var result = [];
    var key;
    for (key in params) {
        if (!params.hasOwnProperty(key)) {
            continue;
        }
        result.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key] || ''))
    }
    return result.join('&');
}

function ajaxAsync(method, url, params, data) {
    return new Promise(function(resolve, reject) {
        const xmlhttp = new XMLHttpRequest();
        xmlhttp.open(method, url + (params ? '?' + makeURIParams(params) : ''));
        xmlhttp.setRequestHeader('Content-Type', 'application/json; charset=utf-8');
        xmlhttp.onreadystatechange = function() {
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
    getUserForRegcodeEmailAsync: function(regcode) {
        return ajaxAsync('GET', REGSERVER_API_BASE_URL +'/user', {regcode: regcode, email: null});
    },
    getUserForRegcodeId: function(regcodeId) {
        return ajaxAsync('GET', REGSERVER_API_BASE_URL + '/user', {regcodeId: regcodeId});
    },
    updateUser: function(user) {
        return ajaxAsync('PUT', REGSERVER_API_BASE_URL + '/user', null, user);
    },
    requestUser: function(user) {
        return ajaxAsync('POST', REGSERVER_API_BASE_URL + '/user_request', null, user);
    },
    registerUser: function(user) {
        return ajaxAsync('POST', REGSERVER_API_BASE_URL + '/register', null, user);
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
    applicationLink: 'reg-application-link',
    registerOkMail: 'register-ok-mail',
    registerFail: 'register-fail'
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
    removeAllChildren: function(el) {
        while(el.firstChild) {
            el.removeChild(el.firstChild);
        }
    },
    setElementText: function(el, text) {
        this.removeAllChildren(el);
        el.appendChild(document.createTextNode(text));
    },
    onInput: function(el, handler) {
        el.addEventListener('input', function() { handler(el.value); });
    },
    onClick: function(el, handler) {
        if (el.getAttribute('type') === 'submit') {
            el.setAttribute('type', 'button');
        }
        el.addEventListener('click', function() { handler(); });
    },
    ensureVisible: function(el) {
        if (el.scrollIntoViewIfNeeded) {
            el.scrollIntoViewIfNeeded(false);
        } else {
            if (el.scrollIntoView) {
                el.scrollIntoView(false);
            }
        }
    }
};

const MakeLayout = {
    attachHandlers: function(scheme, onChange) {
        scheme.forEach(function(scheme) {
            const inputEl = scheme.elementId && document.getElementById(scheme.elementId);
            if (inputEl) {
                DOMUtils.onInput(inputEl, function(str) { onChange(scheme.id, str); })
            }
            const radioEls = scheme.radioName && document.getElementsByName(scheme.radioName);
            if (radioEls && radioEls.length) {
                Array.prototype.slice.call(radioEls).forEach(function(el) {
                    DOMUtils.onClick(el, function() { onChange(scheme.id, el.value); })
                });
            }
        });
    },
    disableControls: function(scheme, disable) {
        scheme.forEach(function(scheme) {
            const inputEl = scheme.elementId && document.getElementById(scheme.elementId);
            if (inputEl) {
                inputEl.disabled = disable;
            }
            const radioEls = scheme.radioName && document.getElementsByName(scheme.radioName);
            if (radioEls && radioEls.length) {
                Array.prototype.slice.call(radioEls).forEach(function(el) {
                    el.disabled = disable;
                });
            }
        });
    },
    toggleRequiredAlert: function(inputEl, showAlert) {
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
    disableAutocomplete: function(ids) {
        ids.forEach(function(id) {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute('autocomplete', 'off');
            }
        });
    }
};

const FillData = {
    fillDataItemEl: function(el, data) {
        if (typeof el.value !== 'undefined') {
            el.value = data;
        } else {
            el.textContent = data;
        }
    },
    fillUserItem: function(scheme, data) {
        scheme.forEach(function(scheme) {
            const inputEl = scheme.elementId && document.getElementById(scheme.elementId);
            if (inputEl) {
                FillData.fillDataItemEl(inputEl, data[scheme.id] || '');
            }
            const radioEls = scheme.radioName && document.getElementsByName(scheme.radioName);
            if (radioEls && radioEls.length) {
                Array.prototype.slice.call(radioEls).forEach(function(el) {
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
    requestRegcodeAsync: function(regcode) {
        checkingUser.requested = {
            regcode: regcode
        };
        return API.getUserForRegcodeEmailAsync(regcode, null)
            .then(function(user) {
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

const checkServerRegcode = debounce(function() {
    switchPageState({loading: true});
    const regcode = currentUser.regcode;
    checkingUser.requestRegcodeAsync(regcode)
        .then(function(user) {
            switchPageState({validRegcode: true, disableUserInfo: false, showLoginType: true, loading: false});
            onRegcodedUserReceived(user);
        })
        .catch(function() {
            switchPageState({validRegcode: !regcode, disableUserInfo: !!regcode, showLoginType: !regcode, loading: false});
        });
}, 200);

function checkRegcode(regcode) {
    currentUser.regcode = regcode;
    if (!currentUser.regcode) {
        switchPageState({validRegcode: true, disableUserInfo: false, showLoginType: true, loading: false});
    } else if (currentUser.regcode.length === 8) {
        checkServerRegcode()
    }
}

const updateServerData = debounce(function() {API.updateUser(Object.assign({}, currentUser.user, {id: loadedUserId})); }, 200);

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

(function(){
    'use strict';
    
    var isObject = function (obj) {
	return obj && typeof obj === 'object';
    };

    if(Object.assign) return;
    Object.defineProperty(Object, 'assign', {
	value: function(target, source){
	    var s, i, props;
	    if (!isObject(target)) { throw new TypeError('target must be an object'); }
	    for (s = 1; s < arguments.length; ++s) {
		source = arguments[s];
		if (!isObject(source)) { throw new TypeError('source ' + s + ' must be an object'); }
		props = Object.keys(Object(source));
		for (i = 0; i < props.length; ++i) {
		    target[props[i]] = source[props[i]];
		}
	    }
	    return target;
	},
	enumerable: false
    });
})();

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
        .then(function() {
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
        .catch(function(err) {
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

    const hasAbsent = USER_INFO_SCHEME.reduce(function(hasAbsent, scheme) {
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
    addUser({loginType: 'password', password: password});
}

var getPassword = null; // will be defined later

function onPassword(/*index, psw*/) {
    switchPageState({
        warningPassword: !getPassword()
    });
}

var acceptDisaclaimer = null; // will be defined later

function onAcceptDisclaimer(checked) {
    acceptDisaclaimer();
}

function toggleClass(el, cls, isSet) {
    if (isSet) {
        el.classList.add(cls);
    } else {
        el.classList.remove(cls);
    }
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
        toggleClass(document.body, 'no-login-type', !ops.showLoginType);
    }
    if (ops.showPassword != null) {
        toggleClass(document.body, 'no-password', !ops.showPassword);
    }
    if (ops.showRegister != null) {
        toggleClass(document.body, 'no-register', !ops.showRegister);
    }
    if (ops.warningUserdata != null) {
        toggleClass(document.body, 'warning-userdata', ops.warningUserdata);
    }
    if (ops.warningPassword != null) {
        toggleClass(document.body, 'warning-password', ops.warningPassword);
    }
    if (ops.loading != null) {
        toggleClass(document.body, 'register-loading', ops.loading);
    }
    if (ops.register != null) {
        toggleClass(document.body, 'register-ok-mail', !!ops.register.mail);
        toggleClass(document.body, 'register-fail', !!ops.register.fail);
        if (ops.register.mail) {
            const registerOkMailEl = document.getElementById(ELEMENT_ID.registerOkMail);
            if (registerOkMailEl) {
                DOMUtils.ensureVisible(registerOkMailEl);
            }
        }
        if (ops.register.fail) {
            const registerFailEl = document.getElementById(ELEMENT_ID.registerFail);
            if (registerFailEl) {
                DOMUtils.ensureVisible(registerFailEl);
            }
        }
    }
    if (ops.validRegcode != null) {
        toggleClass(document.body, 'valid-regcode', ops.validRegcode);
    }
    if (ops.showAppLink != null) {
        toggleClass(document.body, 'show-app-link', ops.showAppLink);
    }
}

function onDocumentLoad() {
    document.body.classList.remove('loading');
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
        USER_INFO_SCHEME.map(function(scheme) { return scheme.elementId; })
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
    const passwordInputEls = ELEMENT_ID.passwordInputs.map(function(id, index) {
        const passwordInputEl = document.getElementById(id);
        if (passwordInputEl) {
            DOMUtils.onInput(passwordInputEl, function(psw) { onPassword(index, psw); });
        }
        return passwordInputEl;
    });

    function onAcceptDisclaimer(accept) {

        const toggleAttribute = accept ?
            function(el) { el.removeAttribute('disabled'); } :
            function(el) { el.setAttribute('disabled', 'disabled'); };

        function setDisable(el) {
            if (el) {
                toggleAttribute(el);
            }
        }

        if (signupGoogle) {
            setDisable(registerButtonEl);
            setDisable(signupLoginPassword);
            setDisable(signupGoogle);
        }
    }

    const acceptDisclaimerEl = document.getElementById(ELEMENT_ID.acceptDisclaimer);
    if (acceptDisclaimerEl) {
        DOMUtils.onClick(acceptDisclaimerEl, function() { onAcceptDisclaimer(acceptDisclaimerEl.checked); });
    }

    onAcceptDisclaimer(false);

    getPassword = function() {
        return passwordInputEls.reduce(
            function(psw, el, index) {
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
            .then(function(user) {
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
            .catch(function() {
                displayNoUserInfo();
            });
    } else {
        switchPageState({
            disableRegcode: false,
            disableUserInfo: false,
            showLoginType: true,
            showPassword: false,
            showRegister: false,
            loading: false
        });
    }
}
