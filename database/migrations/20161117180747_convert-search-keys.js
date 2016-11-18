const commentTable = 'comment';
const CHROM_MASK = parseInt('1' * 16, 2);
const POS_MASK = parseInt('1' * 28, 2);

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
    var index = searchKey;
    const chrom = CHROM_MASK & index;
    index >>= 16;
    const pos = POS_MASK & index;
    index >>= 28;
    const mutation_code = index;
    return chrom << 56 | pos << 24 | mutation_code
}

function updateCommentSearchKey(knex, oldSearchKey, newSearchKey) {
    console.log(`${newSearchKey}-${oldSearchKey}`);
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
