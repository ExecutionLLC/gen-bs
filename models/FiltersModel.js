'use strict';

const _ = require('lodash');
const async = require('async');

const CollectionUtils = require('../utils/CollectionUtils');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');
const {ENTITY_TYPES} = require('../utils/Enums');
const SecureModelBase = require('./SecureModelBase');

const TableNames = {
    Filters: 'filter',
    FilterTexts: 'filter_text',
    FiltersVersions: 'filter_version'
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
                        id: this._generateId(),
                        creator: userId,
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
                },
                (filterId, callback) => {
                    const dataToInsert = {
                        id: shouldGenerateId ? this._generateId() : filter.id,
                        filterId: filterId,
                        rules: filter.rules
                    };
                    this._unsafeInsert(TableNames.FiltersVersions, dataToInsert, trx, callback);
                }
            ], callback);
        }, callback);
    }

    // It creates a new version of an existing filter
    _update(userId, filter, filterToUpdate, callback) {
        this.db.transactionally((trx, callback) => {
            const dataToInsert = {
                id: this._generateId(),
                filterId: filterToUpdate.filterId,
                rules: filterToUpdate.rules
            };
            this._unsafeInsert(TableNames.FiltersVersions, dataToInsert, trx, callback);
        }, callback);
    }

    _fetch(userId, filterId, callback) {
        this.db.transactionally((trx, callback) => {
            async.waterfall([
                (callback) => this._findFilters(trx, [filterId], userId, false, false, callback),
                (filters) => {
                    if (!filters.length) {
                        callback(new Error('Item not found: ' + filterId));
                    } else {
                        callback(null, ChangeCaseUtil.convertKeysToCamelCase(filters[0]));
                    }
                }
            ],callback);
        }, callback);
    }

    _findFilters(trx, filterIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        async.waterfall([
            (callback) => this._findFiltersMetadata(trx, filterIdsOrNull, userIdOrNull, includeLastVersionsOnly,
                excludeDeleted, callback),
            (filtersMetadata, callback) => {
                const filterIds = _.map(filtersMetadata, filter => filter.filterId);
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
                        description: textsHash[filter.filterId].description,
                        name: textsHash[filter.filterId].name
                    });
                });
                callback(null, filtersWithDescription);
            }
        ], callback);
    }

    _findFiltersMetadata(trx, filterIdsOrNull, userIdOrNull, includeLastVersionsOnly, excludeDeleted, callback) {
        let query = trx.select([
            `${TableNames.FiltersVersions}.id`,
            `${TableNames.FiltersVersions}.rules`,
            `${TableNames.FiltersVersions}.created`,
            `${TableNames.FiltersVersions}.filter_id`,
            `${TableNames.Filters}.type`,
            `${TableNames.Filters}.is_deleted`,
            `${TableNames.Filters}.creator`
        ])
            .from(TableNames.FiltersVersions)
            .leftJoin(TableNames.Filters,`${TableNames.FiltersVersions}.filter_id`,`${TableNames.Filters}.id`)
            .whereRaw('1 = 1');

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
            query = query.andWhere(`${TableNames.FiltersVersions}.id`, 'in', filterIdsOrNull);
        }

        async.waterfall([
            callback => query.asCallback(callback),
            (filters, callback) => this._toCamelCase(filters, callback),
            (filters, callback) => {
                if (includeLastVersionsOnly) {
                    this._getLastFilterVersions(filters, callback);
                } else {
                    callback(null, filters)
                }
            },
            (filters, callback) => {
                if (filterIdsOrNull) {
                    this._ensureAllItemsFound(filters, filterIdsOrNull, callback);
                } else {
                    callback(null, filters);
                }
            }
        ], callback);
    }

    _getLastFilterVersions(filters, callback) {
        const filterVersionGroup = _.groupBy(filters, 'filterId');
        const lastVersions = _.map(filterVersionGroup, filterGroup => {
            const orderedFilters = _.orderBy(filterGroup, ['created'], ['desc']);
            return _.head(orderedFilters);
        });
        callback(null, lastVersions)
    }

    remove(userId, itemId, callback) {
        async.waterfall([
            (callback) => this._fetch(userId, itemId, callback),
            (itemData, callback) => this._remove(itemData.filterId, callback)
        ], callback);
    }

    _remove(itemId, callback) {
        this.db.transactionally((trx, callback) => {
            trx(TableNames.Filters)
                .where('id', itemId)
                .update(ChangeCaseUtil.convertKeysToSnakeCase({isDeleted: true}))
                .asCallback((error) => {
                    callback(error, itemId);
                });
        }, callback);
    }
}

module.exports = FiltersModel;
