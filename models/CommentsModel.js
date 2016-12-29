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

class CommentsModel extends SecureModelBase {
    constructor(models) {
        super(models, 'comment', mappedColumns);
    }

    findAllBySearchKeys(userId, languageId, searchKeys, callback) {
        this.db.asCallback((knex, callback) => {
            this._prepareCommentsBaseSelectQuery(knex, userId, languageId)
                .whereIn('search_key', searchKeys)
                .asCallback((error, commentsData) => {
                    if (error) {
                        callback(error);
                    } else {
                        const comments = _.map(commentsData || [], commentData => this._mapColumns(commentData));
                        callback(null, comments);
                    }
                });
        }, callback);
    }

    findAll(userId, callback) {
        async.waterfall([
            (callback) => this._fetchUserComments(userId, callback),
            (comments, callback) => this._mapItems(comments, callback)
        ], callback);
    }

    findMany(userId, commentIds, callback) {
        async.waterfall([
            (callback) => this._fetchComments(commentIds, callback),
            (comments, callback) => this._ensureAllItemsFound(comments, commentIds, callback),
            (comments, callback) => async.map(comments, (comment, callback) => {
                this._ensureItemNotDeleted(comment, callback);
            }, callback),
            (comments, callback) => async.map(comments, (comment, callback) => {
                this._checkUserIsCorrect(userId, comment, callback);
            }, callback),
            (comments, callback) => this._mapItems(comments, callback)
        ], callback);
    }

    _add(userId, languageId, comment, shouldGenerateId, callback) {
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
                        languageId,
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
                        languageId: comment.languageId,
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
            (callback) => this._fetchComment(commentId, callback),
            (commentData, callback) => this._checkUserIsCorrect(userId, commentData, callback)
        ], callback);
    }

    _fetchComment(commentId, callback) {
        this.db.asCallback((knex, callback) => {
            this._prepareCommentsBaseSelectQuery(knex)
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
            this._prepareCommentsBaseSelectQuery(knex)
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
            this._prepareCommentsBaseSelectQuery(knex)
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

    /**
     * Creates query for `comment` table joined with `comment_text` table, with optional user id and language id params.
     * */
    _prepareCommentsBaseSelectQuery(knex, userId, languageId) {
        let query = knex
            .select()
            .from(this.baseTableName)
            .innerJoin('comment_text', 'comment_text.comment_id', this.baseTableName + '.id')
            .where('is_deleted', false);
        if (userId) {
            query = query
                .andWhere('creator', userId);
        }
        if (languageId) {
            query = query
                .andWhere('comment_text.language_id', languageId);
        }
        return query;
    }
}

module.exports = CommentsModel;