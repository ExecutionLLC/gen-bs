'use strict';

const _ = require('lodash');
const async = require('async');

const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const SecureModelBase = require('./SecureModelBase');

const mappedColumns = [
    'id',
    'reference',
    'chrom',
    'pos',
    'alt',
    'searchKey',
    'isDeleted',
    'languageId',
    'comment'
];

const TableNames = {
    Comment: 'comment',
    CommentText: 'comment_text'
};

class CommentsModel extends SecureModelBase {
    constructor(models) {
        super(models, TableNames.Comment, mappedColumns);
    }

    findAllBySearchKeys(userId, languageId, searchKeys, callback) {
        this.db.transactionally((trx, callback) => {
            this._fetchCommentsData(trx, null, userId, searchKeys, true, callback);
        }, callback);
    }

    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._fetchCommentsData(trx, null, userId, null, true, callback);
        }, callback);
    }

    findMany(userId, commentIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._fetchCommentsData(trx, commentIds, userId, null, true, callback);
        }, callback);
    }

    _add(userId, languageId, comment, shouldGenerateId, callback) {
        const commentText = _.find(comment.text, text => _.isNull(text.languageId));
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : comment.id,
                        creator: userId,
                        reference: comment.reference,
                        chrom: comment.chrom,
                        pos: comment.pos,
                        alt: comment.alt,
                        searchKey: comment.searchKey
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (commentId, callback) => {
                    const dataToInsert = {
                        commentId,
                        languageId: commentText.languageId,
                        comment: commentText.comment
                    };
                    this._unsafeInsert('comment_text', dataToInsert, trx, (error) => {
                        callback(error, commentId);
                    });
                }
            ], callback);
        }, callback);
    }

    _update(userId, comment, commentToUpdate, callback) {
        const commentText = _.find(commentToUpdate.text, text => _.isNull(text.languageId));
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToUpdate = {
                        reference: commentToUpdate.reference,
                        chrom: commentToUpdate.chrom,
                        pos: commentToUpdate.pos,
                        alt: commentToUpdate.alt,
                        searchKey: commentToUpdate.searchKey
                    };
                    this._unsafeUpdate(comment.id, dataToUpdate, trx, callback);
                },
                (commentId, callback) => {
                    const {languageId, comment} = commentText;
                    const dataToUpdate = {
                        comment
                    };
                    this._updateCommentText(commentId, languageId, dataToUpdate, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _updateCommentText(commentId, languageId, dataToUpdate, trx, callback) {
        trx('comment_text')
            .where('comment_id', commentId)
            .andWhere('language_id', languageId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, commentId);
            });
    }

    _fetch(userId, commentId, callback) {
        async.waterfall([
            (callback) => this._fetchComment(userId, commentId, callback),
            (commentData, callback) => this._checkUserIsCorrect(userId, commentData, callback)
        ], callback);
    }

    _fetchComment(userId, commentId, callback) {
        this.db.asCallback((trx, callback) => {
            async.waterfall([
                (callback) => this._fetchCommentsData(trx, [commentId], userId, null, false, callback),
                (comments) => {
                    if (!comments.length) {
                        callback(new Error('Item not found: ' + commentId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(comments[0]));
                    }
                }
            ], callback);
        }, callback);
    }

    _mapColumns(commentData) {
        const {id, alt, chrom, pos, reference, searchKey, languageId, comment, creator} = commentData;
        return {
            id,
            searchKey,
            alt,
            chrom,
            pos,
            reference,
            text: [
                {
                    languageId,
                    comment
                }
            ],
            creator
        }
    }

    _fetchCommentsData(trx, commentIdsOrNull, userIdOrNull, searchKeysOrNull, excludeDeleted, callback) {
        let query = trx.select([
            `${TableNames.Comment}.id`,
            `${TableNames.Comment}.reference`,
            `${TableNames.Comment}.chrom`,
            `${TableNames.Comment}.pos`,
            `${TableNames.Comment}.alt`,
            `${TableNames.Comment}.search_key`,
            `${TableNames.Comment}.creator`,
            `${TableNames.CommentText}.language_id`,
            `${TableNames.CommentText}.comment`
        ])
            .from(TableNames.Comment)
            .leftJoin(TableNames.CommentText, `${TableNames.Comment}.id`, `${TableNames.CommentText}.comment_id`)
            .whereRaw('1 = 1');

        if (userIdOrNull) {
            query = query.andWhere('creator', userIdOrNull);
        }

        if (excludeDeleted) {
            query = query.andWhere('is_deleted', false);
        }

        if (commentIdsOrNull) {
            query = query.andWhere(`${TableNames.Comment}.id`, 'in', commentIdsOrNull);
        }
        if (searchKeysOrNull) {
            query = query.andWhere(`${TableNames.Comment}.search_key`, 'in', searchKeysOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (comments, callback) => this._toCamelCase(comments, callback),
            (comments, callback) => {
                const mappedComments = _.map(comments, commentData => this._mapColumns(commentData));
                callback(null, mappedComments);
            }
        ], callback);
    }
}

module.exports = CommentsModel;