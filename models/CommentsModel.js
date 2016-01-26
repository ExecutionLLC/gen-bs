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

    add(userId, languId, comment, callback) {
        this.db.transactionally((trx, cb) => {
            async.waterfall([
                (cb) => {
                    const dataToInsert = {
                        id: this._generateId(),
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

    update(userId, commentId, comment, callback) {
        this._fetch(userId, commentId, (error, commentData) => {
            if (error) {
                callback(error);
            } else {
                this.db.transactionally((trx, cb) => {
                    async.waterfall([
                        (cb) => {
                            const dataToUpdate = {
                                reference: comment.reference,
                                chrom: comment.chrom,
                                pos: comment.pos,
                                alt: comment.alt,
                                searchKey: comment.searchKey
                            };
                            this._update(commentId, dataToUpdate, trx, cb);
                        },
                        (commentId, cb) => {
                            const dataToUpdate = {
                                languId: commentData.languId,
                                comment: comment.comment
                            };
                            this._updateCommentText(commentId, dataToUpdate, trx, cb);
                        }
                    ], cb);
                }, callback);
            }
        });
    }

    find(userId, commentId, callback) {
        this._fetch(userId, commentId, (error, commentData) => {
            callback(error, this._mapColumns(commentData));
        });
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
                    cb('Inactive comments found: ' + commentIds + ', userId: ' + userId);
                }
            },
            (commentsData, cb) => {
                if (_.every(commentsData, 'creator', userId)) {
                    cb(null, commentsData);
                } else {
                    cb('Unauthorized comments: ' + commentIds + ', userId: ' + userId);
                }
            },
            (commentsData, cb) => {
                async.map(commentsData, (commentData, cb) => {
                    cb(null, this._mapColumns(commentData));
                }, cb);
            }
        ], callback);
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
                    if (error) {
                        cb(error);
                    } else {
                        if (commentData.length > 0) {
                            cb(null, ChangeCaseUtil.convertKeysToCamelCase(commentData[0]));
                        } else {
                            cb(new Error('Item not found: ' + commentId));
                        }
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