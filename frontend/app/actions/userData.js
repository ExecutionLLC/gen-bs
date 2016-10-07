import _ from 'lodash';

import apiFacade from '../api/ApiFacade';
import {handleError, handleApiResponseErrorAsync} from './errorHandler';
import {
    receiveTotalFields
} from './fields';
import {receiveSavedFilesList} from './savedFiles';
import {
    receiveInitialAnalysesHistory,
    setCurrentAnalysesHistoryIdLoadDataAsync,
    createNewHistoryItem
} from './analysesHistory';
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
import {analyze} from './ui';

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA';
export const REQUEST_USERDATA = 'REQUEST_USERDATA';

const FETCH_USER_DATA_NETWORK_ERROR = 'Cannot load user data. You can reload page and try again.';
const CANNOT_FIND_DEFAULT_ITEMS_ERROR = 'Cannot determine set of default settings (sample, view, filter). ' +
                                        'You can try to set sample, filter, view by hand or try to reload page.';

const dataClient = apiFacade.dataClient;

/*
 * action creators
 */

function requestUserData() {
    return {
        type: REQUEST_USERDATA
    };
}

function receiveUserData(json) {
    return {
        type: RECEIVE_USERDATA,
        userData: json,
        receivedAt: Date.now()
    };
}

export function fetchUserDataAsync() {
    return (dispatch, getState) => {
        dispatch(requestUserData());
        const {ui: {languageId}} = getState();
        return new Promise((resolve) => dataClient.getUserData(
            languageId,
            (error, response) => resolve({error, response})
        )).then(
            ({error, response}) => dispatch(handleApiResponseErrorAsync(FETCH_USER_DATA_NETWORK_ERROR, error, response))
        ).then((response) => {
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

            dispatch(receiveUserData(userData));
            dispatch(filtersListReceive(filters));
            dispatch(viewsListReceive(views));
            dispatch(modelsListReceive(models));

            dispatch(receiveSavedFilesList(savedFiles));
            dispatch(receiveTotalFields(totalFields));
            dispatch(receiveSamplesList(samples));
            dispatch(receiveInitialAnalysesHistory(analyses));

            const sample = _.find(samples, {type: entityType.DEFAULT}) ||
                _.find(samples, {type: entityType.STANDARD});
            const filter = _.find(filters, {type: entityType.DEFAULT}) ||
                _.find(filters, {type: entityType.STANDARD});
            const view = _.find(views, {type: entityType.DEFAULT}) ||
                _.find(views, {type: entityType.STANDARD});
            if (!sample || !filter || !view) {
                dispatch(handleError(null, CANNOT_FIND_DEFAULT_ITEMS_ERROR));
                return;
            }
            dispatch(createNewHistoryItem(sample, filter, view));
            dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(null))
                .then(() => {
                    const historyItem = getState().analysesHistory.newHistoryItem;
                    dispatch(analyze({
                        id: analyses[0] ? analyses[0].id : null,
                        name: historyItem.name,
                        description: historyItem.description,
                        type: historyItem.type,
                        samples: historyItem.samples,
                        viewId: historyItem.viewId,
                        filterId: historyItem.filterId,
                        modelId: historyItem.modelId
                    }));
                });
        });
    };
}
