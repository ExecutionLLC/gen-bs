'use strict';

const _ = require('lodash');
const Uuid = require('node-uuid');

const ModelBase = require('./ModelBase');
const MockModelBase = require('./MockModelBase');

const FILTERS = require('../test_data/filters.json');
const userId = require('../test_data/user_metadata.json')[0].id;

const mappedColumns = ['id', 'name', 'rules', 'description', 'is_disabled_4copy'];

class FiltersModel extends ModelBase {
    constructor(models) {
        super(models, filter);
    }

    add(userId, languId, filter, callback) {
        this._add(userId, languId, filter, callback);
    }

    find(userId, filterId, callback) {
        this._getFilter(userId, filterId, (error, filterData) => {
            if (error) {
                callback(error);
            } else {
                if (filterData) {
                    callback(null, this._compileFilter(filterData));
                } else {
                    callback();
                }
            }
        });
    }

    // Собирает последние версии каждого filter для текущего пользователя
    findAll(userId, callback) {
        this._getUserFilters(userId, (error, filtersData) => {
            if (error) {
                callback(error);
            } else {
                callback(null, this._compileFilters(filtersData));
            }
        });
    }

    // Создаёт новую версию существующего filter
    update(userId, filterId, filter, callback) {
        this._getFilter(userId, filterId, (error, filterData) => {
            if (error) {
                callback(error);
            } else {
                filter.originalFilterId = filterData.original_filter_id || filterData.id;
                this._add(userId, filterData.langu_id, filter, callback);
            }
        });
    }

    // Set is_deleted = true
    remove(userId, filterId, callback) {
        this.knex(this.baseTable)
            .where('creator', userId)
            .andWhere('id', filterId)
            .update({
                is_deleted: true
            })
            .then(() => {
                callback(null, filterId);
            })
            .catch((error) => {
                callback(error)
            });
    }

    _getFilter(userId, filterId, callback) {
        this.knex.select()
            .from(this.baseTable)
            .innerJoin('filter_text', 'filter_text.filter_id', 'filter.id')
            .where('creator', userId)
            .andWhere('id', filterId)
            .then((filterData) => {
                if (filterData.length > 0) {
                    callback(null, filterData[0]);
                } else {
                    callback();
                }
            })
            .catch((error) => {
                callback(error);
            });
    }

    _getUserFilters(userId, callback) {
        const _query = 'SELECT * FROM ' +
            '(SELECT ROW_NUMBER() OVER (' +
            'PARTITION BY CASE WHEN original_filter_id isnull THEN id ELSE original_filter_id END ORDER BY timestamp DESC) AS RN, * ' +
            'FROM ' + this.baseTable + ' ' +
            'INNER JOIN filter_text ON filter_text.filter_id = filter.id ' +
            'WHERE creator = \'' + userId + '\' AND is_deleted = false) T WHERE T.RN = 1';
        this.knex.raw(_query)
            .then((filtersData) => {
                callback(null, filtersData.rows);
            })
            .catch((error) => {
                callback(error);
            });
    }

    _compileFilters(filtersData) {
        return _.map(filtersData, (filterData) => {
            return this._compileFilter(filterData);
        });
    }

    _compileFilter(filterData) {
        return _.reduce(mappedColumns, (memo, column) => {
            memo[column] = filterData[column];
            return memo;
        }, {});
    }

    _add(userId, languId, filter, callback) {
        this.knex.transaction((trx) => {
            let filterId;
            return this._addFilter(userId, filter, trx)
                .then((insertedFilter) => {
                    filterId = insertedFilter.id;
                    return this._addFilterDescription(filterId, languId, filter.description, trx);
                })
                .then(() => {
                    trx.commit;
                    callback(null, filterId);
                })
                .catch(trx.rollback)
        });
    }

    _addFilter(userId, filter, trx) {
        const id = super._generateId();
        let dataToInsert = {
            id: id,
            name: filter.name,
            rules: filter.rules,
            filter_type: 'user',  // TODO: какой точно тип?
            creator: userId
        };
        if (filter.originalfilterId) {
            dataToInsert.original_filter_id = filter.originalFilterId;
        }
        return this.knex(this.baseTable)
            .transacting(trx)
            .insert(dataToInsert)
            .then(() => {
                return dataToInsert;
            });
    }

    _addFilterDescription(filterId, languId, description, trx) {
        const dataToInsert = {
            filter_id: filterId,
            langu_id: languId,
            description: description
        };
        return this.knex('filter_text')
            .transacting(trx)
            .insert(dataToInsert)
            .then(() => {
                return dataToInsert;
            });
    }
}

module.exports = FiltersModel;
