jest.setMock('../app/api/ApiFacade', require('./__mocks__/apiFacade'));

import HttpStatus from 'http-status';

import {ImmutableHashedArray} from '../app/utils/immutable';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {filtersListServerCreateFilter, filtersListServerUpdateFilter, filtersListServerDeleteFilter} from '../app/actions/filtersList';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';
import {makeListedObjectTests} from './HashedArrayDataUtils';


function mockFilterRemove(sessionId, filterId, callback, expected) {
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK});
    }
}

function mockFilterUpdate(sessionId, filter, callback, expected) {
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.filterResponse});
    }
}

function mockFilterCreate(sessionId, languageId, filter, callback, expected) {
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.filterResponse});
    }
}


function mockViewRemove(sessionId, viewId, callback, expected) {
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK});
    }
}

function mockViewUpdate(sessionId, view, callback, expected) {
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.viewResponse});
    }
}

function mockViewCreate(sessionId, languageId, view, callback, expected) {
    if (expected.error) {
        return callback(expected.error, {status: 500});
    } else {
        return callback(null, {status: HttpStatus.OK, body: expected.viewResponse});
    }
}


function buildFiltersState(appState) {
    const {
        auth,
        ui,
        filtersList: {hashedArray: {array: filters}}
    } = appState;

    const initialAppState = {
        auth: auth,
        ui: ui,
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters),
            selectedFilterId: filters[0].id
        }
    };

    return {
        initialAppState,
        filters,
        createdFilterId: "createdf-ilte-ride-ntif-ier000000000"
    };
}


function buildViewsState(appState) {
    const {
        auth,
        ui,
        viewsList: {hashedArray: {array: views}}
    } = appState;

    const initialAppState = {
        auth: auth,
        ui: ui,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views),
            selectedViewId: views[0].id
        }
    };

    return {
        initialAppState,
        views,
        createdViewId: "createdv-iewi-dent-ifie-r00000000000"
    };
}


const filtersTests = makeListedObjectTests({
    describes: {
        initial: 'Mocked filters list state',
        deleteTests: 'Filters list delete tests',
        updateTests: 'Filters list update tests',
        createTests: 'Filters list create tests'
    },
    buildInitState() {
        const {initialAppState, filters, createdFilterId} = buildFiltersState(MOCK_APP_STATE);
        return {
            initialAppState,
            list: filters,
            createItemId: createdFilterId
        };
    },
    makeActions: {
        remove(filterId, sessionId) {
            return (dispatch) => {
                dispatch(filtersListServerDeleteFilter(filterId, sessionId));
            };
        },
        update(newFilter, sessionId) {
            return (dispatch) => {
                dispatch(filtersListServerUpdateFilter(newFilter, sessionId));
            };
        },
        create(newFilter, sessionId, languageId) {
            return (dispatch) => {
                return dispatch(filtersListServerCreateFilter(newFilter, sessionId, languageId));
            }
        }
    },
    makeMocks: {
        remove(mustError) {
            return () => {
                apiFacade.filtersClient.remove = (requestSessionId, requestFilterId, callback) => mockFilterRemove(
                    requestSessionId, requestFilterId, callback,
                    {error: mustError ? {message: 'mockedError'} : null}
                );
            };
        },
        update(itemToResponse, mustError) {
            return () => {
                apiFacade.filtersClient.update = (requestSessionId, requestFilter, callback) => mockFilterUpdate(
                    requestSessionId, requestFilter, callback,
                    {
                        filterResponse: itemToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        },
        create(filterToResponse, mustError) {
            return () => {
                apiFacade.filtersClient.add = (requestSessionId, requestLanguageId, requestFilter, callback) => mockFilterCreate(
                    requestSessionId, requestLanguageId, requestFilter, callback,
                    {
                        filterResponse: filterToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        }
    },
    getStateHashedArray(globalState) {
        const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
        return filtersHashedArray;
    }
});

const viewsTests = makeListedObjectTests({
    describes: {
        initial: 'Mocked views list state',
        deleteTests: 'Views list delete tests',
        updateTests: 'Views list update tests',
        createTests: 'Views list create tests'
    },
    buildInitState() {
        const {initialAppState, views, createdViewId} = buildViewsState(MOCK_APP_STATE);
        return {
            initialAppState,
            list: views,
            createdItemId: createdViewId
        };
    },
    makeActions: {
        remove(viewId, sessionId) {
            return (dispatch) => {
                dispatch(viewsListServerDeleteView(viewId, sessionId));
            };
        },
        update(newView, sessionId) {
            return (dispatch) => {
                dispatch(viewsListServerUpdateView(newView, sessionId));
            };
        },
        create(newView, sessionId, languageId) {
            return (dispatch) => {
                return dispatch(viewsListServerCreateView(newView, sessionId, languageId));
            }
        }
    },
    makeMocks: {
        remove(mustError) {
            return () => {
                apiFacade.viewsClient.remove = (requestSessionId, requestViewId, callback) => mockViewRemove(
                    requestSessionId, requestViewId, callback,
                    {error: mustError ? {message: 'mockedError'} : null}
                );
            };
        },
        update(itemToResponse, mustError) {
            return () => {
                apiFacade.viewsClient.update = (requestSessionId, requestView, callback) => mockViewUpdate(
                    requestSessionId, requestView, callback,
                    {
                        viewResponse: itemToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        },
        create(viewToResponse, mustError) {
            return () => {
                apiFacade.viewsClient.add = (requestSessionId, requestLanguageId, requestView, callback) => mockViewCreate(
                    requestSessionId, requestLanguageId, requestView, callback,
                    {
                        viewResponse: viewToResponse,
                        error: mustError ? {message: 'mockError'} : null
                    }
                );
            };
        }
    },
    getStateHashedArray(globalState) {
        const {viewsList: {hashedArray: viewsHashedArray}} = globalState;
        return viewsHashedArray;
    }
});

filtersTests();
viewsTests();
