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


    //testViewsModel(callback) {
    //    this._addLang((error, lang) => {
    //        if (error) {
    //            callback(error);
    //        } else {
    //            console.log('LANG');
    //            console.log(lang);
    //
    //            this._addUser((error, _userId) => {
    //                if (error) {
    //                    callback(error);
    //                } else {
    //                    console.log('USER');
    //                    console.log(_userId);
    //
    //                    // ?
    //                    this._addViews(_userId, DEFAULT_LANG.id, (error, viewsData) => {
    //                        if (error) {
    //                            callback(error);
    //                        } else {
    //                            console.log('VIEWS');
    //                            console.log(viewsData);
    //
    //
    //                            this.views.find(_userId, viewsData[0], (error, view) => {
    //                                if (error) {
    //                                    callback(error);
    //                                } else {
    //                                    console.log('Inserted view:');
    //                                    console.log(view);
    //
    //                                    //
    //                                    this.views.update(user.id, viewsData[0], view, (error, updatedViewId) => {
    //                                        if (error) {
    //                                            callback(error);
    //                                        } else {
    //                                            console.log('UPDATE view: ' + updatedViewId);
    //
    //                                            //
    //                                            // TODO: можем ли так удалять? Предварительно - да
    //                                            this.views.remove(user.id, viewsData[0], (error, viewId) => {
    //                                                if (error) {
    //                                                    callback(error);
    //                                                } else {
    //                                                    console.log('DELETE view: ' + viewId);
    //
    //                                                    callback();
    //                                                }
    //                                            });
    //                                        }
    //                                    });
    //                                }
    //                            });
    //                        }
    //                    });
    //                }
    //            });
    //        }
    //    });
    //}
    //
    //testFiltersModel(callback) {
    //
    //}

    //_addLang(callback) {
    //    this.langu._exists(DEFAULT_LANG.id, (error, lang) => {
    //        if (error) {
    //            callback(error);
    //        } else {
    //            if (lang) {
    //                callback(null, lang);
    //            } else {
    //                this.langu.add(DEFAULT_LANG, (error, result) => {
    //                    callback(error, result);
    //                });
    //            }
    //        }
    //    });
    //}
    //
    //_addUser(callback) {
    //    const _user = {
    //        id: userId,
    //        email: 'test@domain.com',
    //        default_langu_id: DEFAULT_LANG.id,
    //        number_paid_samples: 0
    //    };
    //    this.user._exists(_user.id, (error, userExists) => {
    //        if (error) {
    //            callback(error);
    //        } else {
    //            if (!userExists) {
    //                this.user.add(_user, (error, user) => {
    //                    if(error) {
    //                        callback(error);
    //                    } else {
    //                        callback(null, userId);
    //                    }
    //                });
    //            } else {
    //                callback(null, userId);
    //            }
    //        }
    //    });
    //}
    //
    //_addViews(_userId, _langId, callback) {
    //
    //    const promises = _.map(VIEWS, view => {
    //        const _view = ChangeCaseUtil.convertKeysToCamelCase(view);
    //        return this.views.add(_userId, _langId, _view, (error, viewData) => {
    //            return viewData;
    //            //if (error) {
    //            //    callback(error);
    //            //} else {
    //            //    callback(null, viewData);
    //            //}
    //        }).then((viewData) => {
    //            return viewData;
    //        });
    //    });
    //
    //    Promise.all(promises).then(function(res) {
    //        console.log('ok');
    //        console.log(res);
    //        callback(null, res);
    //        // все загрузились
    //    }, function(error) {
    //        cosnole.log('error');
    //        console.log(error);
    //        callback(error);
    //        // одно или несколько не хочет
    //    });




        //let _count = VIEWS.length;
        //let _views = [];
        //_.each(VIEWS, (view) => {
        //    const _view = ChangeCaseUtil.convertKeysToCamelCase(view);
        //    this.views.add(user.id, lang.id, _view, (error, viewData) => {
        //        if(error) {
        //            callback(error);
        //        } else {
        //            _views.push(viewData);
        //            _count--;
        //        }
        //        if (_count == 0) {
        //            callback(null, _views);
        //        }
        //    });
        //});
   // }

}

var testModels = new TestModels();
testModels.process();