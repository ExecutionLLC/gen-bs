export const FILTERS_LIST_START_SERVER_OPERATION = 'FILTERS_LIST_START_SERVER_OPERATION';
export const FILTERS_LIST_END_SERVER_OPERATION = 'FILTERS_LIST_END_SERVER_OPERATION';
export const FILTERS_LIST_RECEIVE = 'FILTERS_LIST_RECEIVE';
export const FILTERS_LIST_SELECT_FILTER = 'FILTERS_LIST_SELECT_FILTER';
export const FILTERS_LIST_ADD_FILTER = 'FILTERS_LIST_ADD_FILTER';
export const FILTERS_LIST_DELETE_FILTER = 'FILTERS_LIST_DELETE_FILTER';
export const FILTERS_LIST_EDIT_FILTER = 'FILTERS_LIST_EDIT_FILTER';

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
        filters: filters
    };
}

export function filtersListSelectFilter(filterId) {
    return {
        type: FILTERS_LIST_SELECT_FILTER,
        filterId: filterId
    };
}

export function filtersListAddFilter(filter) {
    return {
        type: FILTERS_LIST_ADD_FILTER,
        filter: filter
    };
}

export function filtersListDeleteFilter(filterId) {
    return {
        type: FILTERS_LIST_DELETE_FILTER,
        filterId: filterId
    };
}

export function filtersListEditFilter(filterId, filter) {
    return {
        type: FILTERS_LIST_EDIT_FILTER,
        filterId: filterId,
        filter: filter
    };
}

