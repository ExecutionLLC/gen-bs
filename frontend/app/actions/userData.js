import {getP} from 'redux-polyglot/dist/selectors';

import apiFacade from '../api/ApiFacade';
import {handleError, handleApiResponseErrorAsync} from './errorHandler';
import {
    receiveTotalFields
} from './fields';
import {
    receiveMetadata
} from './metadata';
import {receiveSavedFilesList} from './savedFiles';
import * as HistoryItemUtils from '../utils/HistoryItemUtils';
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
import {getDefaultOrStandardItem} from '../utils/entityTypes';
import {analyze, setCurrentLanguageId} from './ui';
import {uploadsListReceive} from './fileUpload';
import * as i18n from '../utils/i18n';

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
                metadata,
                totalFields,
                savedFiles,
                analyses,
                uploads
            } = userData;

            dispatch(receiveUserData(userData));
            dispatch(setCurrentLanguageId(userData.profileMetadata.defaultLanguageId));
            const p = getP(getState()); // get new state because of its changing in 'setCurrentLanguageId' action
            dispatch(filtersListReceive(filters));
            dispatch(viewsListReceive(views));
            dispatch(modelsListReceive(models));

            dispatch(receiveSavedFilesList(savedFiles));
            dispatch(receiveTotalFields(totalFields));
            dispatch(receiveMetadata(metadata));
            dispatch(receiveSamplesList(samples));
            dispatch(receiveInitialAnalysesHistory(analyses));
            dispatch(uploadsListReceive(uploads));

            const sample = getDefaultOrStandardItem(samples);
            const filter = getDefaultOrStandardItem(filters);
            const view = getDefaultOrStandardItem(views);
            if (!sample || !filter || !view) {
                dispatch(handleError(null, CANNOT_FIND_DEFAULT_ITEMS_ERROR));
                return;
            }
            const lastHistoryAnalysis = analyses[0];
            const newAnalysisName = HistoryItemUtils.makeNewHistoryItemName(sample, filter, view, languageId);
            const newAnalysisDescription = p.t('analysis.descriptionOf', {name: newAnalysisName});
            dispatch(createNewHistoryItem(
                sample, filter, view,
                {name: newAnalysisName, description: newAnalysisDescription},
                languageId
            ));
            dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(lastHistoryAnalysis ? lastHistoryAnalysis.id : null))
                .then(() => {
                    const currentAnalysis = lastHistoryAnalysis || getState().analysesHistory.newHistoryItem;
                    const {
                        type, samples, viewId, filterId, modelId
                    } = currentAnalysis;
                    const {name, description} = i18n.getEntityText(currentAnalysis, languageId);
                    const searchParams = i18n.changeEntityText(
                        {
                            id: lastHistoryAnalysis ? lastHistoryAnalysis.id : null,
                            type,
                            samples,
                            viewId,
                            filterId,
                            modelId
                        },
                        languageId,
                        {
                            name,
                            description
                        }
                    );
                    dispatch(analyze(searchParams));
                });
        });
    };
}
