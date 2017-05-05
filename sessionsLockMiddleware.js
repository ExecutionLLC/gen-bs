'use strict';

const cookie = require('cookie');
const signature = require('cookie-signature');
const Config = require('./utils/Config');


const sessionsCounter = {};

const getcookie = (() => {

    // for given from express-sessions functions
    function debug(s) {
        console.log(s);
    }

    // from express-session
    function unsigncookie(val, secrets) {
        for (var i = 0; i < secrets.length; i++) {
            var result = signature.unsign(val, secrets[i]);

            if (result !== false) {
                return result;
            }
        }

        return false;
    }

    // from express-session
    function getcookie(req, name, secrets) {
        var header = req.headers.cookie;
        var raw;
        var val;

        // read from cookie header
        if (header) {
            var cookies = cookie.parse(header);

            raw = cookies[name];

            if (raw) {
                if (raw.substr(0, 2) === 's:') {
                    val = unsigncookie(raw.slice(2), secrets);

                    if (val === false) {
                        debug('cookie signature invalid');
                        val = undefined;
                    }
                } else {
                    debug('cookie unsigned')
                }
            }
        }

        // back-compat read from cookieParser() signedCookies data
        if (!val && req.signedCookies) {
            val = req.signedCookies[name];

            if (val) {
                deprecate('cookie should be available in req.headers.cookie');
            }
        }

        // back-compat read from cookieParser() cookies data
        if (!val && req.cookies) {
            raw = req.cookies[name];

            if (raw) {
                if (raw.substr(0, 2) === 's:') {
                    val = unsigncookie(raw.slice(2), secrets);

                    if (val) {
                        deprecate('cookie should be available in req.headers.cookie');
                    }

                    if (val === false) {
                        debug('cookie signature invalid');
                        val = undefined;
                    }
                } else {
                    debug('cookie unsigned')
                }
            }
        }

        return val;
    }

    return getcookie;
})();

function lockSession(sessionId, callback) {
    if (!sessionsCounter[sessionId]) {
        sessionsCounter[sessionId] = [];
        callback();
    } else {
        sessionsCounter[sessionId].push(() => {
            callback();
        });
    }

}

function unlockSession(sessionId) {
    if (!sessionsCounter[sessionId]) {
        return;
    }
    const nextF = sessionsCounter[sessionId].shift();
    if (nextF) {
        nextF();
    } else {
        delete sessionsCounter[sessionId];
    }
}

function sessionLockMiddleware(req, res, next) {
    const sessionId = getcookie(req, Config.sessions.sessionCookieName, [Config.sessions.sessionSecret]);

    function letGoNext() {
        unlockSession(sessionId);
    }

    res.on('finish', () => {
        letGoNext();
    });
    res.on('close', () => {
        letGoNext();
    });

    lockSession(sessionId, next);
}

module.exports = {
    sessionLockMiddleware,
    lockSession,
    unlockSession
};