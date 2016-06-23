import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {filtersListServerCreateFilter, filtersListServerUpdateFilter, filtersListServerDeleteFilter} from '../app/actions/filtersList';
import {runListedObjectTests} from './HashedArrayDataUtils';


const {filtersClient} = apiFacade;


function buildFiltersState(appState) {
    const {
        auth,
        ui,
        filtersList: {hashedArray: {array: filters}}
    } = appState;

    const initialAppState = {
        auth,
        ui,
        filtersList: {
            hashedArray: ImmutableHashedArray.makeFromArray(filters),
            selectedFilterId: filters[0].id
        }
    };

    return {
        initialAppState,
        filters,
        createdFilterId: 'createdf-ilte-ride-ntif-ier000000000'
    };
}


runListedObjectTests({
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
            filtersClient.remove = (sessionId, filterId, callback) => {
                if (mustError) {
                    return callback({message: 'mockedError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK});
                }
            };
        },
        update(itemToResponse, mustError) {
            filtersClient.update = (sessionId, filter, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: _.cloneDeep(filter)});
                }
            };
        },
        create(filterToResponse, mustError, newFilterId) {
            filtersClient.add = (sessionId, languageId, filter, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: {..._.cloneDeep(filter), id: newFilterId}});
                }
            };
        }
    },
    removeMocks: {
        remove() {
            delete filtersClient.remove;
        },
        update() {
            delete filtersClient.update;
        },
        create() {
            delete filtersClient.add;
        }
    },
    getStateHashedArray(globalState) {
        const {filtersList: {hashedArray: filtersHashedArray}} = globalState;
        return filtersHashedArray;
    }
});
