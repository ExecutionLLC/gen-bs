import HttpStatus from 'http-status';

import {ImmutableHashedArray} from '../app/utils/immutable';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';
import {makeListedObjectTests} from './HashedArrayDataUtils';


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

viewsTests();
