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
    'languId',
    'comment'
];

class CommentsModel extends SecureModelBase {
    constructor(models) {
        super(models, 'comment', mappedColumns);
    }

    // It collects each comment for the current user
    findAll(userId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchUserComments(userId, callback);
            },
            (commentsData, callback) => {
                async.map(commentsData, (commentData, callback) => {
                    callback(null, this._mapColumns(commentData));
                }, callback);
            }
        ], callback);
    }

    findMany(userId, commentIds, callback) {
        async.waterfall([
            (callback) => { this._fetchComments(commentIds, callback); },
            (commentsData, callback) => {
                if ((commentsData.length == commentIds.length) &&
                    (_.every(commentsData, 'isDeleted', false))) {
                        callback(null, commentsData);
                } else {
                    callback('Some comments not found: ' + commentIds + ', userId: ' + userId);
                }
            },
            (commentsData, callback) => {
                if (_.every(commentsData, 'creator', userId)) {
                    callback(null, commentsData);
                } else {
                    callback('Unauthorized access to comments: ' + commentIds + ', userId: ' + userId);
                }
            },
            (commentsData, callback) => {
                async.map(commentsData, (commentData, callback) => {
                    callback(null, this._mapColumns(commentData));
                }, callback);
            }
        ], callback);
    }

    _add(userId, languId, comment, shouldGenerateId, callback) {
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
                        commentId: commentId,
                        languId: languId,
                        comment: comment.comment
                    };
                    this._unsafeInsert('comment_text', dataToInsert, trx, (error) => {
                        callback(error, commentId);
                    });
                }
            ], callback);
        }, callback);
    }

    _update(userId, comment, commentToUpdate, callback) {
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
                    const dataToUpdate = {
                        languId: comment.languId,
                        comment: commentToUpdate.comment
                    };
                    this._updateCommentText(commentId, dataToUpdate, trx, callback);
                }
            ], callback);
        }, callback);
    }

    _updateCommentText(commentId, dataToUpdate, trx, callback) {
        trx('comment_text')
            .where('comment_id', commentId)
            .update(ChangeCaseUtil.convertKeysToSnakeCase(dataToUpdate))
            .asCallback((error) => {
                callback(error, commentId);
            });
    }

    _fetch(userId, commentId, callback) {
        async.waterfall([
            (callback) => {
                this._fetchComment(commentId, callback);
            },
            (commentData, callback) => {
                this._checkUserIsCorrect(userId, commentData, callback);
            }
        ], callback);
    }

    _fetchComment(commentId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
                .where('id', commentId)
                .asCallback((error, commentData) => {
                    if (error || !commentData.length) {
                        callback(error || new Error('Item not found: ' + commentId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(commentData[0]));
                    }
                });
        }, callback);
    }

    _fetchUserComments(userId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
                .where('creator', userId)
                .andWhere('is_deleted', false)
                .asCallback((error, commentsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(commentsData));
                    }
                });
        }, callback);
    }

    _fetchComments(commentIds, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
                .whereIn('id', commentIds)
                .asCallback((error, commentsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(commentsData));
                    }
                });
        }, callback);
    }
}

module.exports = CommentsModel;