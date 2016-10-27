'use strict';

const crypto = require('crypto');

const HASH_ALG = 'sha256';
const HASH_SECRET = '7d213abb-14e4-404e-8237-325b08989c6c';
const DIGEST_TYPE = 'hex';

class PasswordUtils {
    static hash(password) {
        return crypto.createHmac(HASH_ALG, HASH_SECRET)
            .update(password)
            .digest(DIGEST_TYPE);
    }
}

module.exports = PasswordUtils;
