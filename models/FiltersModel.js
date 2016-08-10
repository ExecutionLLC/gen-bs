'use strict';

const _ = require('lodash');
const async = require('async');

const CollectionUtils = require('../utils/CollectionUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const {ENTITY_TYPES} = require('../utils/Enums');
const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Filters: 'filter',
    FilterTexts: 'filter_text'
};

const mappedColumns = [
    'id',
    'originalFilterId',
    'name',
    'rules',
    'type',
    'isDeleted',
    'isCopyDisabled',
    'languId',
    'description'
];

class FiltersModel extends SecureModelBase {
    constructor(models) {
        super(models, 'filter', mappedColumns);
    }

    // It collects the latest version of each filter for the current user
    findAll(userId, callback) {
        this.db.transactionally((trx, callback) => {
            this._findFilters(trx, null, userId, true, true, callback);
        }, callback);
    }

    findMany(userId, filterIds, callback) {
        this.db.transactionally((trx, callback) => {
            this._findFilters(trx, filterIds, userId, false, false, callback);
        }, callback);
    }

    find(userId, filterId, callback) {
        const filterIds = [filterId];
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findFilters(trx, filterIds, userId, false, false, callback),
                (filters, callback) => callback(null, _.first(filters))
            ], (error, filter) => {
                callback(error, filter);
            });
        }, callback);
    }

    _add(userId, languId, filter, shouldGenerateId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._ensureNameIsValid(filter.name, callback),
                (callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : filter.id,
                        creator: userId,
                        rules: filter.rules,
                        type: filter.type || ENTITY_TYPES.USER
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (filterId, callback) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: languId,
                        name: filter.name,
                        description: filter.description
                    };
                    this._unsafeInsert('filter_text', dataToInsert, trx, (error) => {
                        callback(error, filterId);
                    });
                }
            ], callback);
        }, callback);
    }

    // It creates a new version of an existing filter
    _update(userId, filter, filterToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => {
                    const dataToInsert = {
                        id: this._generateId(),
                        creator: userId,
                        rules: filterToUpdate.rules,
                        type: filter.type,
                        originalFilterId: filter.originalFilterId || filter.id
                    };
                    this._insert(dataToInsert, trx, callback);
                },
                (filterId, callback) => {
                    const dataToInsert = {
                        filterId: filterId,
                        languId: filter.languId,
                        name: filterToUpdate.name,
                        description: filterToUpdate.description
                    };
                    this._unsafeInsert('filter_text', dataToInsert, trx, (error) => {
                        callback(error, filterId);
                    });
                }
            ], callback);
        }, callback);
    }

    _fetch(userId, filterId, callback) {
        async.waterfall([
            (callback) => this._fetchFilter(filterId, callback),
            (filter, callback) => this._checkUserIsCorrect(userId, filter, callback)
        ], callback);
    }

    _fetchFilter(filterId, callback) {
        this.db.asCallback((knex, callback) => {
            knex.select()
                .from(this.baseTableName)
                .innerJoin('filter_text', 'filter_text.filter_id', this.baseTableName + '.id')
                .where('id', filterId)
                .asCallback((error, filterData) => {
                    if (error || !filterData.length) {
                        callback(error || new Error('Item not found: ' + filterId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(filterData[0]));
                    }
            });
        }, callback);
    }

    _findFilters(trx, filterIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findFiltersMetadata(trx, filterIdsOrNull, userIdOrNull, includeLastVersionsOnly,
                excludeDeleted, callback),
            (filtersMetadata, callback) => {
                const filterIds = _.map(filtersMetadata, filter => filter.id);
                callback(null, filtersMetadata, filterIds);
            },
            (filters, filterIds, callback) => {
                this._attachFiltersDescriptions(trx, filters, filterIds, callback);
            }
        ], (error, filters) => {
            callback(error, filters);
        });
    }

    _attachFiltersDescriptions(trx, filters, filterIds, callback) {
        async.waterfall([
            (callback) => {
                trx.select()
                    .from(TableNames.FilterTexts)
                    .whereIn('filter_id', filterIds)
                    .asCallback(callback);
            },
            (filterTexts, callback) => this._toCamelCase(filterTexts, callback),
            (filterTexts, callback) => {
                const textsHash = CollectionUtils.createHashByKey(filterTexts, 'filterId');
                const filtersWithDescription = _.map(filters, filter => {
                    return Object.assign({}, filter, {
                        description: textsHash[filter.id].description
                    });
                });
                callback(null, filtersWithDescription);
            }
        ], callback);
    }

    _findFiltersMetadata(trx, filterIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        let query = trx.select()
            .from(TableNames.Filters)
            .whereRaw('1 = 1');
        if (includeLastVersionsOnly) {
            const selectLastFilterIds = 'SELECT' +
                '  T.id' +
                ' FROM (' +
                '  SELECT ROW_NUMBER() OVER (' +
                '    PARTITION BY CASE WHEN original_filter_id isnull THEN id ELSE original_filter_id END ORDER BY timestamp DESC' +
                '  ) AS RN,' +
                '  id' +
                '  FROM filter' +
                ' ) AS T' +
                ' WHERE T.RN = 1';
            query = query.andWhereRaw('filter.id IN (' + selectLastFilterIds + ')');
        }

        if (userIdOrNull) {
            query = query.andWhere(function () {
                this.whereNull('creator')
                    .orWhere('creator', userIdOrNull);
            });
        } else {
            query = query.andWhere('creator', null);
        }

        if (excludeDeleted) {
            query = query.andWhere('is_deleted', false);
        }

        if (filterIdsOrNull) {
            query = query.andWhere('id', 'in', filterIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (filters, callback) => this._toCamelCase(filters, callback),
            (filters, callback) => {
                if (filterIdsOrNull) {
                    this._ensureAllItemsFound(filters, filterIdsOrNull, callback);
                } else {
                    callback(null, filters);
                }
            }
        ], callback);
    }
}

module.exports = FiltersModel;
