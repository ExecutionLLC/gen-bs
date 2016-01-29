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

    // Собирает все comments для текущего пользователя
    findAll(userId, callback) {
        this._fetchUserComments(userId, (error, commentsData) => {
            if (error) {
                callback(error);
            } else {
                async.map(commentsData, (commentData, cb) => {
                    cb(null, this._mapColumns(commentData));
                }, callback);
            }
        });
    }

    findMany(userId, commentIds, callback) {
        async.waterfall([
            (cb) => { this._fetchComments(commentIds, cb); },
            (commentsData, cb) => {
                if (commentsData.length == commentIds.length) {
                    cb(null, commentsData);
                } else {
                    cb('Some comments not found: ' + commentIds + ', userId: ' + userId);
                }
            },
            (commentsData, cb) => {
                if (_.every(commentsData, 'creator', userId)) {
                    cb(null, commentsData);
                } else {
                    cb('Unauthorized access to comments: ' + commentIds + ', userId: ' + userId);
                }
            },
            (commentsData, cb) => {
                async.map(commentsData, (commentData, cb) => {
                    cb(null, this._mapColumns(commentData));
                }, cb);
            }
        ], callback);
    }

    _add(userId, languId, comment, shouldGenerateId, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : comment.id,
                        creator: userId,
                        reference: comment.reference,
                        chrom: comment.chrom,
                        pos: comment.pos,
                        alt: comment.alt,
                        searchKey: comment.searchKey
                    };
                    this._insert(dataToInsert, trx, cb);
                },
                (commentId, cb) => {
                    const dataToInsert = {
                        commentId: commentId,
                        languId: languId,
                        comment: comment.comment
                    };
                    this._insertIntoTable('comment_text', dataToInsert, trx, (error) => {
                        cb(error, commentId);
                    });
                }
            ], cb);
        }, callback);
    }

    _update(userId, data, newData, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToUpdate = {
                        reference: newData.reference,
                        chrom: newData.chrom,
                        pos: newData.pos,
                        alt: newData.alt,
                        searchKey: newData.searchKey
                    };
                    this._unsafeUpdate(data.id, dataToUpdate, trx, cb);
                },
                (id, cb) => {
                    const dataToUpdate = {
                        languId: data.languId,
                        comment: newData.comment
                    };
                    this._updateCommentText(id, dataToUpdate, trx, cb);
                }
            ], cb);
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
        this._fetchComment(commentId, (error, data) => {
            if (error) {
                callback(error);
            } else {
                const secureInfo = {userId: userId};
                this._secureCheck(data, secureInfo, callback);
            }
        });
    }

    _fetchComment(commentId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
                .where('id', commentId)
                .asCallback((error, commentData) => {
                    if (error || !commentData.length) {
                        cb(error || new Error('Item not found: ' + commentId));
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(commentData[0]));
                    }
                });
        }, callback);
    }

    _fetchUserComments(userId, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
                .where('creator', userId)
                .andWhere('is_deleted', false)
                .asCallback((error, commentsData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(commentsData));
                    }
                });
        }, callback);
    }

    _fetchComments(commentIds, callback) {
        this.db.asCallback((knex, cb) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
                .whereIn('id', commentIds)
                .asCallback((error, commentsData) => {
                    if (error) {
                        cb(error);
                    } else {
                        cb(null, ChangeCaseUtil.convertKeysToCamelCase(commentsData));
                    }
                });
        }, callback);
    }
}

module.exports = CommentsModel;