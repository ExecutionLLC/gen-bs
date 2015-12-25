'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

const mappedColumns = ['id', 'description'];

class LanguModel extends ModelBase {
    constructor(models) {
        super(models, 'langu');
    }

    add(langu, callback) {
        this.knex(this.baseTable).insert(langu)
            .then(() => {
                callback(null, langu);
            })
            .catch((error) => {
                callback(error);
            });
    }

    find(languId, callback) {
        this._getLangu(languId, (error, languData) => {
            if (error) {
                callback(error);
            } else {
                if (languData) {
                    callback(null, this._compileLangu(languData));
                } else {
                    callback();
                }
            }
        });
    }

    _getLangu(languId, callback) {
        this.knex.select()
            .from(this.baseTable)
            .where({id: languId})
            .then((rows) => {
                if (rows.length > 0) {
                    callback(null, rows[0]);
                } else {
                    callback();
                }
            })
            .catch((error) => {
                callback(error);
            });
    }

    _compileLangu(languData) {
        return _.reduce(mappedColumns, (memo, column) => {
            memo[column] = languData[column];
            return memo;
        }, {});
    }
}

module.exports = LanguModel;