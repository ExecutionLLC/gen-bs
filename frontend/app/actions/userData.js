import HttpStatus from 'http-status';
import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleError} from './errorHandler';
import {/*receiveFields, */receiveTotalFields} from './fields';
import {receiveSavedFilesList} from './savedFiles';
import {
    receiveInitialQueryHistory,
    setCurrentQueryHistoryId,
    createNewHistoryItem
} from './queryHistory';
//import {analyze} from './ui';
import {receiveSamplesList} from './samplesList';
import {
    filtersListReceive
} from './filtersList';
import {
    viewsListReceive
} from './viewsList';
import {
    modelsListReceive
} from './modelsList';
import {entityType} from '../utils/entityTypes';
import {fetchFields} from './fields';
import {analyze} from './ui';

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA';
export const REQUEST_USERDATA = 'REQUEST_USERDATA';

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
                    models,
                    totalFields,
                    savedFiles,
                    analyses
                } = userData;

                dispatch(receiveUserdata(userData));
                dispatch(filtersListReceive(filters));
                dispatch(viewsListReceive(views));
                dispatch(modelsListReceive(models));

                dispatch(receiveSavedFilesList(savedFiles));
                dispatch(receiveTotalFields(totalFields));
                dispatch(receiveSamplesList(samples));
                dispatch(receiveInitialQueryHistory(analyses));
                if (analyses[0]) {
                    const historyItem = analyses[0];
                    dispatch(fetchFields(historyItem.samples[0].id)); // TODO check if no need to wait fetchFields
                    dispatch(setCurrentQueryHistoryId(historyItem.id));
                    dispatch(analyze({
                        id: historyItem.id,
                        name: historyItem.name,
                        description: historyItem.description,
                        type: historyItem.type,
                        samples: historyItem.samples,
                        viewId: historyItem.viewId,
                        filterId: historyItem.filterId,
                        modelId: historyItem.modelId
                    }));
                } else {
                    const sample = _.find(samples, {type: entityType.STANDARD});
                    const filter = _.find(filters, {type: entityType.STANDARD});
                    const view = _.find(views, {type: entityType.STANDARD});
                    if (!sample || !filter || !view) {
                        dispatch(handleError(null, CANNOT_FIND_DEFAULT_ITEMS_ERROR));
                    } else {
                        dispatch(fetchFields(sample.id)); // TODO check if no need to wait fetchFields
                        dispatch(createNewHistoryItem(sample, filter, view));
                        dispatch(setCurrentQueryHistoryId(null));
                        const historyItem = getState().queryHistory.newHistoryItem;
                        dispatch(analyze({
                            id: null,
                            name: historyItem.name,
                            description: historyItem.description,
                            type: historyItem.type,
                            samples: historyItem.samples,
                            viewId: historyItem.viewId,
                            filterId: historyItem.filterId,
                            modelId: historyItem.modelId
                        }));
                    }
                }

                // if (!sample || !filter || !view) {
                //     dispatch(handleError(null, CANNOT_FIND_DEFAULT_ITEMS_ERROR));
                // } else {
                //     /*dispatch(analyze(sample.id, view.id, filter.id)); FIXME analyze: replace by reanalyze */
                // }
            }
        });
    };
}
