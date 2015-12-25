'use strict';

const ServiceBase = require('./ServiceBase');

class SearchService extends ServiceBase {
    constructor(services) {
        super(services);
    }

    sendSearchRequest(user, sessionId, viewId, filterIds, globalSearchValue, fieldSearchValues, callback) {
        // Check that session id is valid and belongs to the specified user.
        this.services.sessions.findById(sessionId, user.id, (error) => {
            if (error) {
                callback(error);
            } else {
                this.services.sessions.startSearchOperation(sessionId, (error, searchOperationId) => {
                    if (error) {
                        callback(error);
                    } else {
                        this.services.views.find(user, viewId, (error, view) => {
                            if (error) {
                                callback(error);
                            } else {
                                this.services.filters.findMany(user, filterIds, (error, filters) => {
                                    const params = {
                                        view: view,
                                        filters: filters,
                                        globalSearchValue: globalSearchValue,
                                        fieldSearchValues: fieldSearchValues
                                    };

                                    this.services.applicationServer.requestOpenSearchSession(searchOperationId, params, (error, operationId) => {
                                        if (error) {
                                            callback(error);
                                        } else if (operationId !== searchOperationId) {
                                            callback(new Error('Operation id is changed by the application server! The search session will not be available for the client.'));
                                        } else {
                                            callback(searchOperationId);
                                        }
                                    });
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    searchInResults(user, sessionId, operationId, globalSearchValue, fieldSearchValues, callback) {
        const sessions = this.services.sessions;
        sessions.findById(sessionId, user.id, (error) => {
           if (error) {
               callback(error);
           } else {
               sessions.checkOperationType(sessionId, operationId, sessions.operationTypes().SEARCH, (error) => {
                   if (error) {
                       callback(error);
                   } else {
                       const params = {
                           globalSearchValue: globalSearchValue,
                           fieldSearchValues: fieldSearchValues
                       };

                       this.services.applicationServer.requestSearchInResults(operationId, params, (error) => {
                           if (error) {
                               callback(error);
                           } else {
                               callback(null, operationId);
                           }
                       });
                   }
               });
           }
        });
    }
}

module.exports = SearchService;
