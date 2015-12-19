'use strict';

const Knex = require('knex');

const ModelBase = require('./ModelBase');

const TableName = 'view';

class ViewsModel extends ModelBase {
    constructor(models) {
        super(models);

        this.knex = new Knex();
    }

    add(view) {

    }

    _knex() {

    }
}