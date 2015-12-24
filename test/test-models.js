'use strict';

const _ = require('lodash');
const uuid = require('node-uuid');

const LanguModel = require('../models/LanguModel');
const ViewsModel = require('../models/ViewsModel');
const UserModel = require('../models/UserModel');

const Config = require('../utils/Config');
const ChangeCaseUtil = require('../utils/ChangeCaseUtil');

const VIEWS = require('../test_data/views.json');
const DEFAULT_LANG = {
    id: 'RU',
    description: 'Russian'
}

class TestViewsModel {
    constructor() {
        this.config = Config;
        this.langu = new LanguModel(this);
        this.views = new ViewsModel(this);
        this.user = new UserModel(this);
    }

    add() {
        this.addLang((error, lang) => {
            console.log('LANG:');
            if (error) {
                console.log(error);
            } else {
                console.log(lang);

                this.addUser((error, user) => {
                    console.log('USER:');
                    if (error) {
                        console.log(error);
                    } else {
                        console.log(user);

                        this.addViews(user, lang, () => {
                            console.log('VIEWS:')
                        });
                    }
                });
            }
        });
    }

    get() {
        //this.views._getView('f31c3475-55db-4015-b1cc-ec620ca47950', DEFAULT_LANG.id, '999bd545-1b30-45a2-bdc5-559620c85575', (error, viewData) => {
        //    console.log(error, viewData);
        //});


        this.views._getUserViews('f31c3475-55db-4015-b1cc-ec620ca47950', DEFAULT_LANG.id, (error, viewsData) => {
            console.log('VIEWS:');
            console.log(error, viewsData);

            _.each(viewsData, (viewData) => {
                this.views._getViewItems(viewData.id, (error, viewItemsData) => {
                    console.log('VIEW ITEMS:');
                    console.log(error, viewItemsData);
                });
            });
        });
    }

    addLang(callback) {
        this.langu.get(DEFAULT_LANG.id, (error, lang) => {
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

    addUser(callback) {
        const user = {
            id: uuid.v4(),
            email: 'test@domain.com',
            default_langu_id: DEFAULT_LANG.id,
            number_paid_samples: 0
        };
        this.user.add(user, (error, result) => {
            if(error) {
                callback(error);
            } else {
                callback(null, result);
            }
        });
    }

    addViews(user, lang, callback) {
        _.each(VIEWS, (view) => {
            const _view = ChangeCaseUtil.convertKeysToCamelCase(view);
            this.views.add(user.id, lang.id, _view, (error, result) => {
                if(error) {
                    console.log(error);
                    //callback(error);
                } else {
                    console.log(result);
                }
            });
        });

        callback();
    }

}

var model = new TestViewsModel();

model.add();
model.get();