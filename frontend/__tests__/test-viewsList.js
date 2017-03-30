import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {viewsListServerCreateView, viewsListServerUpdateView, viewsListServerDeleteView} from '../app/actions/viewsList';
import {runListedObjectTests} from './HashedArrayDataUtils';


const {viewsClient} = apiFacade;


function buildViewsState(appState) {
    const {
        auth,
        ui,
        viewsList: {hashedArray: {array: views}}
    } = appState;

    const initialAppState = {
        auth,
        ui,
        viewsList: {
            hashedArray: ImmutableHashedArray.makeFromArray(views)
        }
    };

    return {
        initialAppState,
        views,
        createdViewId: 'createdv-iewi-dent-ifie-r00000000000'
    };
}


runListedObjectTests({
    listName: 'Views list',
    buildInitState() {
        const {initialAppState, views, createdViewId} = buildViewsState(MOCK_APP_STATE);
        return {
            initialAppState,
            list: views,
            createdItemId: createdViewId
        };
    },
    makeActions: {
        remove(viewId) {
            return (dispatch) => {
                dispatch(viewsListServerDeleteView(viewId));
            };
        },
        update(newView) {
            return (dispatch) => {
                dispatch(viewsListServerUpdateView(newView));
            };
        },
        create(newView, languageId) {
            return (dispatch) => {
                return dispatch(viewsListServerCreateView(newView, languageId));
            }
        }
    },
    makeMocks: {
        remove(mustError) {
            viewsClient.remove = (viewId, callback) => {
                if (mustError) {
                    return callback({message: 'mockedError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: {id: viewId}});
                }
            };
        },
        update(mustError) {
            viewsClient.update = (view, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: _.cloneDeep(view)});
                }
            };
        },
        create(mustError, newViewId) {
            viewsClient.add = (languageId, view, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: {..._.cloneDeep(view), id: newViewId}});
                }
            };
        }
    },
    removeMocks: {
        remove() {
            delete viewsClient.remove;
        },
        update() {
            delete viewsClient.update;
        },
        create() {
            delete viewsClient.add;
        }
    },
    getStateHashedArray(globalState) {
        const {viewsList: {hashedArray: viewsHashedArray}} = globalState;
        return viewsHashedArray;
    }
});
