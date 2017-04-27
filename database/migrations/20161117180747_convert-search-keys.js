const just = require('string-just');
const Num = require('./utils/Num');
const commentTable = 'comment';
const CHROM_MASK = parseInt(new Array(16).fill('1').join(''), 2);
const POS_MASK = parseInt(new Array(28).fill('1').join(''), 2);

exports.up = function (knex, Promise) {
    return updateComments(knex, Promise);
};

exports.down = function () {
    throw new Error('Not implemented.')
};

function findComments(knex) {
    return knex(commentTable)
        .select('search_key')
        .map(result => result['search_key'])
}

function convertSearchKey(searchKey) {
    var index = parseInt(searchKey);
    const chrom = CHROM_MASK & index;
    index = moveRight(index, 16);
    const pos = POS_MASK & index;
    index = moveRight(index, 28);
    const mutation_code = index;
    const strRes = `${intToString(chrom, 8)}${intToString(pos, 32)}${intToString(mutation_code, 24)}`;
    return convert(strRes, 2);
}

function convert(numStr, base) {
    var fullNum = new Num(numStr, base);
    return fullNum.fmt();
}

function moveRight(intValue, count) {
    const str = intValue.toString(2);
    const newStr = str.substr(0, str.length - count);
    return parseInt(newStr, 2) || 0;
}

function intToString(value, maxValue) {
    var str = just.rjust(value.toString(2), maxValue, '0');
    return str;
}

function updateCommentSearchKey(knex, oldSearchKey, newSearchKey) {
    return knex(commentTable)
        .where('search_key', oldSearchKey)
        .update({
            search_key: newSearchKey
        });
}

function updateComments(knex, Promise) {
    return findComments(knex)
        .then((searchKeys) => Promise.map(searchKeys, searchKey => {
            const newSearchKey = convertSearchKey(searchKey);
            return updateCommentSearchKey(knex, searchKey, newSearchKey);
        }))
}