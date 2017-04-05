import HttpStatus from 'http-status';
import _ from 'lodash';

import {ImmutableHashedArray} from '../app/utils/immutable';
import MOCK_APP_STATE from './__data__/appState.json';
import apiFacade from '../app/api/ApiFacade';
import {filtersListServerCreateFilterAsync, filtersListServerUpdateFilterAsync, filtersListServerDeleteFilterAsync} from '../app/actions/filtersList';
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
            hashedArray: ImmutableHashedArray.makeFromArray(filters)
        }
    };

    return {
        initialAppState,
        filters,
        createdFilterId: 'createdf-ilte-ride-ntif-ier000000000'
    };
}


runListedObjectTests({
    listName: 'Filters list',
    buildInitState() {
        const {initialAppState, filters, createdFilterId} = buildFiltersState(MOCK_APP_STATE);
        return {
            initialAppState,
            list: filters,
            createdItemId: createdFilterId
        };
    },
    makeActions: {
        remove(filterId) {
            return (dispatch) => {
                dispatch(filtersListServerDeleteFilterAsync(filterId));
            };
        },
        update(newFilter) {
            return (dispatch) => {
                dispatch(filtersListServerUpdateFilterAsync(newFilter));
            };
        },
        create(newFilter, languageId) {
            return (dispatch) => {
                return dispatch(filtersListServerCreateFilterAsync(newFilter, languageId));
            }
        }
    },
    makeMocks: {
        remove(mustError) {
            filtersClient.remove = (filterId, callback) => {
                if (mustError) {
                    return callback({message: 'mockedError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: {id: filterId}});
                }
            };
        },
        update(mustError) {
            filtersClient.update = (filter, callback) => {
                if (mustError) {
                    return callback({message: 'mockError'}, {status: 500});
                } else {
                    return callback(null, {status: HttpStatus.OK, body: _.cloneDeep(filter)});
                }
            };
        },
        create(mustError, newFilterId) {
            filtersClient.add = (languageId, filter, callback) => {
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
