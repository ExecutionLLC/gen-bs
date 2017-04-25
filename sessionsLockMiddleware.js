'use strict';

const cookie = require('cookie');
const signature = require('cookie-signature');
const Config = require('./utils/Config');


const sessionsCounter = {};

function sessionLockMiddleware(req, res, next) {

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

    // debug code
    const r = Math.floor(Math.random() * 900 + 100);

    const sessionId = getcookie(req, Config.sessions.sessionCookieName, [Config.sessions.sessionSecret]);

    // debug code
    console.log(`>>> ${r} ${sessionId} ${sessionsCounter[sessionId] ? sessionsCounter[sessionId].length : '-'}`);

    function letGoNext() {
        if (!sessionsCounter[sessionId]) {
            // debug code
            console.log(`>>> ${r} let go next: no array`);
            return;
        }
        const nextF = sessionsCounter[sessionId].shift();
        if (nextF) {
            // debug code
            console.log(`>>> ${r} let go next, queue len ${sessionsCounter[sessionId].length}`);
            nextF();
        } else {
            // debug code
            console.log(`>>> ${r} no next, del queue`);
            delete sessionsCounter[sessionId];
        }
    }

    res.on('finish', () => {
        // debug code
        console.log(`<<< ${r} finish`);
        letGoNext();
    });
    res.on('close', () => {
        // debug code
        console.log(`<<< ${r} close`);
        letGoNext();
    });

    if (!sessionsCounter[sessionId]) {
        // debug code
        console.log(`>>> ${r} [] enter first`);
        sessionsCounter[sessionId] = [];
        next();
    } else {
        // debug code
        console.log(`>>> ${r} ++ wait`);
        sessionsCounter[sessionId].push(() => {
            // debug code
            console.log(`>>> ${r} >>> can proceed`);
            next();
        });
    }
}

module.exports = sessionLockMiddleware;