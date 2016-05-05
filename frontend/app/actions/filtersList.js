export const FILTERS_LIST_START_SERVER_OPERATION = 'FILTERS_LIST_START_SERVER_OPERATION';
export const FILTERS_LIST_END_SERVER_OPERATION = 'FILTERS_LIST_END_SERVER_OPERATION';
export const FILTERS_LIST_RECEIVE = 'FILTERS_LIST_RECEIVE';

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
    }
}
