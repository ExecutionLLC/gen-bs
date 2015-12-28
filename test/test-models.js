'use strict';

const _ = require('lodash');
var async = require('async');
const uuid = require('node-uuid');

const LanguModel = require('../models/LanguModel');
const UserModel = require('../models/UserModel');
const ViewsModel = require('../models/ViewsModel');
const ViewItemsModel = require('../models/ViewItemsModel');
const KeywordsModel = require('../models/KeywordsModel');
const SynonymsModel = require('../models/SynonymsModel');
const FiltersModel = require('../models/FiltersModel');

const Config = require('../utils/Config');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const USERS = require('../test_data/user_metadata.json');
const KEYWORDS = require('../test_data/keywords.json');
const VIEWS = require('../test_data/views.json');
const FILTERS = require('../test_data/filters.json');

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
        this.views = new ViewsModel(this);
        this.viewItems = new ViewItemsModel(this);
        this.filters = new FiltersModel(this);
        this.keywords = new KeywordsModel(this);
        this.synonyms = new SynonymsModel(this);
        this.user = new UserModel(this);

        this.userId = DEFAULT_USER_ID;
    }

    process() {
        let self = this;

        async.waterfall([
            function(cb) { self._defaultLanguExists(cb); },
            function(exists, cb) { self._addDefaultLangu(exists, cb); },
            function(languId, cb) { self._output('LANG:', languId, cb); },
            function(languId, cb) { self._insertKeywords(languId, cb); },
            function(insertedKeywords, cb) { self._output('KEYWORDS INSERTED:', insertedKeywords, cb); },
            function(insertedKeywords, cb) { self._insertUsers(cb); },
            function(insertedUsers, cb) {
                self.userId = insertedUsers[0];
                self._output('USERS INSERTED:', insertedUsers, cb);
            },
            function(insertedUsers, cb) { self._insertViews(cb); },
            function(insertedViews, cb) { self._output('VIEWS INSERTED:', insertedViews, cb); },
            function(x, cb) { process.exit(1); }
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
        this.langu._exists(DEFAULT_LANGU_ID, callback);
    }

    _addDefaultLangu(exists, callback) {
        if (exists) {
            callback(null, DEFAULT_LANGU_ID);
        } else {
            this.langu.add(DEFAULT_LANGU_ID, callback);
        }
    }

    _insertKeywords(languId, callback) {
        let insertedKeywords = [];
        async.each(KEYWORDS, (keyword, cb) => {
            this.keywords.add(languId, keyword, (error, insertedKeyword) => {
                insertedKeywords.push(insertedKeyword);
                cb(error, insertedKeyword);
            });
        }, (error) => {
            callback(error, insertedKeywords);
        });
    }

    _insertUsers(callback) {
        let insertedUsers = [];
        async.each(USERS, (user, cb) => {
            this.user.add(user, (error, insertedUser) => {
                insertedUsers.push(insertedUser);
                cb(error, insertedUser);
            });
        }, (error) => {
            callback(error, insertedUsers);
        });
    }

    _insertViews(callback) {
        let insertedViews = [];
        async.each(VIEWS, (view, cb) => {
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
        async.each(FILTERS, (view, cb) => {
            this.filters.add(view, (error, insertedFilter) => {
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