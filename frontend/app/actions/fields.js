import HttpStatus from 'http-status';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';

/*
 * action types
 */

export const RECEIVE_FIELDS = 'RECEIVE_FIELDS';

export const REQUEST_TOTAL_FIELDS = 'REQUEST_TOTAL_FIELDS';
export const RECEIVE_TOTAL_FIELDS = 'RECEIVE_TOTAL_FIELDS';

const TOTAL_FIELDS_NETWORK_ERROR = 'Cannot get list of all fields (network error). You can reload page and try again.';
const TOTAL_FIELDS_SERVER_ERROR = 'Cannot get list of all fields (server error). You can reload page and try again.';

const samplesClient = apiFacade.samplesClient;

/*
 * action creators
 */
export function receiveFields(fields) {
    return {
        type: RECEIVE_FIELDS,
        fields: fields || [],
        receivedAt: Date.now()
    };
}

export function fetchFields(sampleId) {

    return (dispatch, getState) => {
        const {samplesList: {hashedArray: {hash: samplesHash}}, fields: {totalFieldsHashedArray: {hash: totalFieldsHash}}} = getState();
        const sample = samplesHash[sampleId];
        if (sample) {
            const sampleValues = sample.values;
            const sampleFields = sampleValues.reduce(
                (sampleFieldsList, {fieldId}) => {
                    sampleFieldsList.push(totalFieldsHash[fieldId]);
                    return sampleFieldsList;
                },
                []
            );
            dispatch(receiveFields(sampleFields));
        }
    };
}

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

    return (dispatch) => {
        dispatch(requestTotalFields());

        samplesClient.getAllFields((error, response) => {
            if (error) {
                dispatch(handleError(null, TOTAL_FIELDS_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, TOTAL_FIELDS_SERVER_ERROR));
            } else {
                dispatch(receiveTotalFields(response.body));
            }
        });
    };
}
