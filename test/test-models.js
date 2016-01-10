'use strict';

const _ = require('lodash');
var async = require('async');
const uuid = require('node-uuid');

const LanguModel = require('../models/LanguModel');
const UserModel = require('../models/UserModel');
const KeywordsModel = require('../models/KeywordsModel');
const FiltersModel = require('../models/FiltersModel');
const ViewsModel = require('../models/ViewsModel');
const SamplesModel = require('../models/SamplesModel');
const FieldsMetadataModel = require('../models/FieldsMetadataModel');

const Config = require('../utils/Config');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const USERS = require('../test_data/user_metadata.json');
const KEYWORDS = require('../test_data/keywords.json');
const VIEWS = require('../test_data/views.json');
const FILTERS = require('../test_data/filters.json');
const FIELDS_METADATA = require('../test_data/fields_metadata.json');
const SAMPLE_METADATA = require('../test_data/sample_metadata.json');

const DEFAULT_USER_ID = USERS[0].id;

const DEFAULT_LANG = {
    id: 'en',
    description: 'English'
}
const DEFAULT_LANGU_ID = DEFAULT_LANG.id;

class TestModels {
    constructor() {
        this.config = Config;

        this.langu = new LanguModel(this);
        this.user = new UserModel(this);
        this.keywords = new KeywordsModel(this);
        this.views = new ViewsModel(this);
        this.filters = new FiltersModel(this);
        this.samples = new SamplesModel(this);
        this.fields = new FieldsMetadataModel(this);

        this.userId = DEFAULT_USER_ID;
    }

    process() {
        async.waterfall([
            (cb) => { this._defaultLanguExists(cb); },
            (exists, cb) => { this._addDefaultLangu(exists, cb); },
            (languId, cb) => { this._output('LANG:', languId, cb); },
            (languId, cb) => { this._findLangu('en', cb); },
            (langu, cb) => { this._insertKeywords(langu.id, cb); },
            (insertedKeywords, cb) => {
                this._output('KEYWORDS INSERTED:', insertedKeywords, cb);
            },
            (insertedKeywords, cb) => {
                this.keywords.find(insertedKeywords[0], cb);
            },
            (keyword, cb) => {
                this._output('FIND KEYWORD:', keyword, cb);
            },
            (keyword, cb) => { this._insertUsers(cb); },
            (insertedUsers, cb) => {
                this.userId = insertedUsers[0];
                this._output('USERS INSERTED:', insertedUsers, cb);
            },
            (insertedUsers, cb) => {
                this._insertFilters(cb);
            },
            (insertedFilters, cb) => { this._output('FILTERS INSERTED:', insertedFilters, cb); },
            (insertedFilters, cb) => { this.filters.find(this.userId, insertedFilters[0], cb); },
            (filter, cb) => { this._output('FILTER:', filter, cb); },
            (filter, cb) => {
                this._insertViews(cb);
            },
            (insertedViews, cb) => { this._output('VIEWS INSERTED:', insertedViews, cb); },
            (insertedViews, cb) => { this.views.find(this.userId, insertedViews[1], cb); },
            (view, cb) => { this._output('VIEW:', view, cb); },
            (xcode, cb) => { process.exit(1); }
        ], (error) => {
            if (error) {
                console.log('ERROR ', error);
                process.exit(1);
            }
        });
    }

    _output(title, data, callback) {
        console.log(title);
        console.log(data);
        callback(null, data);
    }

    _defaultLanguExists(callback) {
        this.langu.exists(DEFAULT_LANGU_ID, callback);
    }

    _addDefaultLangu(exists, callback) {
        if (exists) {
            callback(null, DEFAULT_LANGU_ID);
        } else {
            this.langu.add(DEFAULT_LANG, callback);
        }
    }

    _findLangu(languId, callback) {
        this.langu.find(languId, callback);
    }

    _insertKeywords(languId, callback) {
        let insertedKeywords = [];
        async.each(ChangeCaseUtil.convertKeysToCamelCase(KEYWORDS), (keyword, cb) => {
            this.keywords.addWithId(languId, keyword, (error, insertedKeyword) => {
                insertedKeywords.push(insertedKeyword);
                cb(error, insertedKeyword);
            });
        }, (error) => {
            callback(error, insertedKeywords);
        });
    }

    _insertUsers(callback) {
        let insertedUsers = [];
        async.each(ChangeCaseUtil.convertKeysToCamelCase(USERS), (user, cb) => {
            this.user.add(user, DEFAULT_LANGU_ID, (error, insertedUser) => {
                insertedUsers.push(insertedUser);
                cb(error, insertedUser);
            });
        }, (error) => {
            callback(error, insertedUsers);
        });
    }

    _insertViews(callback) {
        let insertedViews = [];
        async.each(ChangeCaseUtil.convertKeysToCamelCase(VIEWS), (view, cb) => {
            this.views.add(this.userId, DEFAULT_LANGU_ID, view, (error, insertedView) => {
                insertedViews.push(insertedView);
                cb(error, insertedView);
            });
        }, (error) => {
            callback(error, insertedViews);
        });
    }

    _insertFilters(callback) {
        let insertedFilters = [];
        async.each(ChangeCaseUtil.convertKeysToCamelCase(FILTERS), (filter, cb) => {
            this.filters.add(this.userId, DEFAULT_LANGU_ID, filter, (error, insertedFilter) => {
                insertedFilters.push(insertedFilter);
                cb(error, insertedFilter);
            });
        }, (error) => {
            callback(error, insertedFilters);
        });
    }
}

var testModels = new TestModels();
testModels.process();