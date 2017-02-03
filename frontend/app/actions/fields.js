import HttpStatus from 'http-status';
import {getP} from 'redux-polyglot/dist/selectors';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';

/*
 * action types
 */

export const REQUEST_TOTAL_FIELDS = 'REQUEST_TOTAL_FIELDS';
export const RECEIVE_TOTAL_FIELDS = 'RECEIVE_TOTAL_FIELDS';

const samplesClient = apiFacade.samplesClient;

/*
 * action creators
 */
function requestTotalFields() {
    return {
        type: REQUEST_TOTAL_FIELDS
    };
}

export function receiveTotalFields(json) {
    return {
        type: RECEIVE_TOTAL_FIELDS,
        fields: json,
        receivedAt: Date.now()
    };
}

export function fetchTotalFields() {

    return (dispatch, getState) => {
        dispatch(requestTotalFields());

        samplesClient.getAllFields((error, response) => {
            if (error) {
                const p = getP(getState());
                dispatch(handleError(null, p.t('errors.totalFieldsNetworkError')));
            } else if (response.status !== HttpStatus.OK) {
                const p = getP(getState());
                dispatch(handleError(null, p.t('errors.totalFieldsServerError')));
            } else {
                dispatch(receiveTotalFields(response.body));
            }
        });
    };
}
