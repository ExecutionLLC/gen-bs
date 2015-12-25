'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

const LanguModel = require('../models/LanguModel');
const UserModel = require('../models/UserModel');
const ViewsModel = require('../models/ViewsModel');
const KeywordsModel = require('../models/KeywordsModel');
const FiltersModel = require('../models/FiltersModel');

const Config = require('../utils/Config');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const VIEWS = require('../test_data/views.json');
const FILTERS = require('../test_data/filters.json');
const userId = require('../test_data/user_metadata.json')[0].id;

const DEFAULT_LANG = {
    id: 'RU',
    description: 'Russian'
}

class TestModels {
    constructor() {
        this.config = Config;
        this.langu = new LanguModel(this);
        this.views = new ViewsModel(this);
        this.user = new UserModel(this);
    }

    process() {
        this.testViewsModel((error, result) => {
            if (error) {
                console.log(error);
            } else {

            }
            process.exit(1);
        });
    }

    testViewsModel(callback) {
        this._addLang((error, lang) => {
            if (error) {
                callback(error);
            } else {
                console.log('LANG');
                console.log(lang);

                this._addUser((error, user) => {
                    if (error) {
                        callback(error);
                    } else {
                        console.log('USER');
                        console.log(user);

                        // ok
                        this._addViews(user, lang, (error, viewsData) => {
                            if (error) {
                                callback(error);
                            } else {
                                console.log('VIEWS');
                                console.log(viewsData);

                                // ok
                                this.views.find(user.id, viewsData[0], (error, view) => {
                                    if (error) {
                                        callback(error);
                                    } else {
                                        console.log('Inserted view:');
                                        console.log(view);

                                        //
                                        this.views.update(user.id, viewsData[0], view, (error, updatedViewId) => {
                                            if (error) {
                                                callback(error);
                                            } else {
                                                console.log('UPDATE view: ' + updatedViewId);

                                                //
                                                // TODO: можем ли так удалять? Предварительно - да
                                                this.views.remove(user.id, viewsData[0], (error, viewId) => {
                                                    if (error) {
                                                        callback(error);
                                                    } else {
                                                        console.log('DELETE view: ' + viewId);

                                                        callback();
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    testFiltersModel(callback) {

    }

    _addLang(callback) {
        this.langu.find(DEFAULT_LANG.id, (error, lang) => {
            if (error) {
                callback(error);
            } else {
                if (lang) {
                    callback(null, lang);
                } else {
                    this.langu.add(DEFAULT_LANG, (error, result) => {
                        callback(error, result);
                    });
                }
            }
        });
    }

    _addUser(callback) {
        const _user = {
            id: uuid.v4(),
            email: 'test@domain.com',
            default_langu_id: DEFAULT_LANG.id,
            number_paid_samples: 0
        };
        this.user.find(_user.id, (error, userData) => {
            if (error) {
                callback(error);
            } else {
                if (!userData) {
                    this.user.add(_user, (error, user) => {
                        if(error) {
                            callback(error);
                        } else {
                            callback(null, user);
                        }
                    });
                } else {
                    callback(null, userData);
                }

            }
        });
    }

    _addViews(user, lang, callback) {
        let _count = VIEWS.length;
        let _views = [];
        _.each(VIEWS, (view) => {
            const _view = ChangeCaseUtil.convertKeysToCamelCase(view);
            this.views.add(user.id, lang.id, _view, (error, viewData) => {
                if(error) {
                    callback(error);
                } else {
                    _views.push(viewData);
                    _count--;
                }
                if (_count == 0) {
                    callback(null, _views);
                }
            });
        });
    }

}

var testModels = new TestModels();
testModels.process();