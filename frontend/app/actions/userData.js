import HttpStatus from 'http-status';
import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';
import {receiveFields, receiveTotalFields} from './fields';
import {receiveSavedFilesList} from './savedFiles';
import {receiveInitialQueryHistory} from './queryHistory';
//import {analyze} from './ui';
import {changeSample, receiveSamplesList} from './samplesList';
import {
    filtersListReceive,
    filtersListSelectFilter
} from './filtersList';
import {
    viewsListReceive,
    viewsListSelectView
} from './viewsList';
import {entityType} from '../utils/entityTypes';

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA';
export const REQUEST_USERDATA = 'REQUEST_USERDATA';

export const CHANGE_HISTORY_DATA = 'CHANGE_HISTORY_DATA';

const FETCH_USER_DATA_NETWORK_ERROR = 'Cannot update user data (network error). You can reload page and try again.';
const FETCH_USER_DATA_SERVER_ERROR = 'Cannot update user data (server error). You can reload page and try again.';

const CANNOT_FIND_DEFAULT_ITEMS_ERROR = 'Cannot determine set of default settings (sample, view, filter). ' +
                                        'You can try to set sample, filter, view by hand or try to reload page.';

const dataClient = apiFacade.dataClient;

/*
 * action creators
 */

function requestUserdata() {
    return {
        type: REQUEST_USERDATA
    };
}

function receiveUserdata(json) {
    return {
        type: RECEIVE_USERDATA,
        userData: json,
        receivedAt: Date.now()
    };
}

export function fetchUserdata() {

    return (dispatch, getState) => {
        dispatch(requestUserdata());
        const {ui: {languageId}} = getState();
        dataClient.getUserData(languageId, (error, response) => {
            if (error) {
                dispatch(handleError(null, FETCH_USER_DATA_NETWORK_ERROR));
            } else if (response.status !== HttpStatus.OK) {
                dispatch(handleError(null, FETCH_USER_DATA_SERVER_ERROR));
            } else {
                const userData = response.body;
                const {
                    samples,
                    filters,
                    views,
                    totalFields,
                    savedFiles,
                    analyses,
                    lastSampleId,
                    lastSampleFields
                } = userData;

                const sample = _.find(samples, {id: lastSampleId}) ||
                               _.find(samples, {type: entityType.STANDARD});
                const filter = _.find(filters, {type: entityType.STANDARD});
                const view = _.find(views, {type: entityType.STANDARD});

                dispatch(receiveUserdata(userData));
                dispatch(filtersListReceive(filters));
                dispatch(viewsListReceive(views));

                dispatch(receiveSavedFilesList(savedFiles));
                dispatch(receiveTotalFields(totalFields));
                dispatch(receiveFields(lastSampleFields));
                dispatch(receiveSamplesList(samples));
                dispatch(receiveInitialQueryHistory(analyses));

                if (!sample || !filter || !view) {
                    dispatch(handleError(null, CANNOT_FIND_DEFAULT_ITEMS_ERROR));
                } else {
                    dispatch(changeSample(sample.id));
                    dispatch(filtersListSelectFilter(filter.id));
                    dispatch(viewsListSelectView(view.id));
                    /*dispatch(analyze(sample.id, view.id, filter.id)); FIXME analyze: replace by reanalyze */
                }
            }
        });
    };
}

export function changeHistoryData(sampleId, filterId, viewId) {
    return {
        type: CHANGE_HISTORY_DATA,
        sampleId,
        filterId,
        viewId
    };
}
