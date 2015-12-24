'use strict';

const _ = require('lodash');

const ModelBase = require('./ModelBase');

class LanguModel extends ModelBase {
    constructor(models) {
        super(models);
    }

    add(langu, callback) {
        this.knex('langu').insert(langu)
            .then(() => {
                callback(null, langu);
            })
            .catch((error) => {
                callback(error);
            });
    }

    get(id, callback) {
        this.knex.select('id', 'description')
            .from('langu')
            .where({id: id})
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

}

module.exports = LanguModel;