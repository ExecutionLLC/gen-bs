import apiFacade from '../api/ApiFacade';
import {handleApiResponseErrorAsync} from './errorHandler';
import {setCurrentAnalysesHistoryIdLoadDataAsync} from './analysesHistory';
import {getP} from 'redux-polyglot/dist/selectors';

const filtersClient = apiFacade.filtersClient;

export const FILTERS_LIST_START_SERVER_OPERATION = 'FILTERS_LIST_START_SERVER_OPERATION';
export const FILTERS_LIST_END_SERVER_OPERATION = 'FILTERS_LIST_END_SERVER_OPERATION';
export const FILTERS_LIST_RECEIVE = 'FILTERS_LIST_RECEIVE';
export const FILTERS_LIST_ADD_FILTER = 'FILTERS_LIST_ADD_FILTER';
export const FILTERS_LIST_DELETE_FILTER = 'FILTERS_LIST_DELETE_FILTER';
export const FILTERS_LIST_EDIT_FILTER = 'FILTERS_LIST_EDIT_FILTER';
export const FILTERS_LIST_SET_HISTORY_FILTER = 'FILTERS_LIST_SET_HISTORY_FILTER';


export function filtersListStartServerOperation() {
    return {
        type: FILTERS_LIST_START_SERVER_OPERATION
    };
}

export function filtersListEndServerOperation() {
    return {
        type: FILTERS_LIST_END_SERVER_OPERATION
    };
}

export function filtersListReceive(filters) {
    return {
        type: FILTERS_LIST_RECEIVE,
        filters
    };
}

export function filtersListAddFilter(filter) {
    return {
        type: FILTERS_LIST_ADD_FILTER,
        filter
    };
}

export function filtersListDeleteFilter(filterId) {
    return {
        type: FILTERS_LIST_DELETE_FILTER,
        filterId
    };
}

export function filtersListEditFilter(filterId, filter) {
    return {
        type: FILTERS_LIST_EDIT_FILTER,
        filterId,
        filter
    };
}

export function filtersListServerCreateFilterAsync(filter, languageId) {
    return (dispatch, getState) => {
        dispatch(filtersListStartServerOperation());
        return new Promise((resolve) => filtersClient.add(
            languageId,
            filter,
            (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            dispatch(filtersListEndServerOperation());
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('filterAndModel.errors.createFilterError'), error, response));
        }).then((response) => response.body
        ).then((newFilter) => {
            dispatch(filtersListAddFilter(newFilter));
            return newFilter;
        });
    };
}

export function filtersListServerUpdateFilterAsync(filter) {
    return (dispatch, getState) => {
        dispatch(filtersListStartServerOperation());
        return new Promise((resolve) => filtersClient.update(filter, (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            dispatch(filtersListEndServerOperation());
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('filterAndModel.errors.updateFilterError'), error, response));
        }).then((response) => response.body
        ).then((updatedFilter) => {
            dispatch(filtersListEditFilter(filter.id, updatedFilter));
            const {analysesHistory: {currentHistoryId}} = getState();
            return dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(currentHistoryId))
                .then(() => updatedFilter);
        });
    };
}

export function filtersListServerDeleteFilterAsync(filterId) {
    return (dispatch, getState) => {
        dispatch(filtersListStartServerOperation());
        return new Promise((resolve) => filtersClient.remove(filterId, (error, response) => resolve({error, response}))
        ).then(({error, response}) => {
            dispatch(filtersListEndServerOperation());
            const p = getP(getState());
            return dispatch(handleApiResponseErrorAsync(p.t('filterAndModel.errors.deleteFilterError'), error, response));
        }).then(() => dispatch(filtersListDeleteFilter(filterId)));
    };
}

export function filtersListSetHistoryFilter(filter) {
    return {
        type: FILTERS_LIST_SET_HISTORY_FILTER,
        filter
    };
}