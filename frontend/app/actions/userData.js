import {getP} from 'redux-polyglot/dist/selectors';

import apiFacade from '../api/ApiFacade';
import {handleApiResponseErrorAsync} from './errorHandler';
import {
    receiveTotalFields
} from './fields';
import {
    receiveMetadata
} from './metadata';
import {receiveSavedFilesList} from './savedFiles';
import {
    receiveInitialAnalysesHistory,
    setCurrentAnalysesHistoryIdLoadDataAsync,
    createNewDefaultHistoryItem
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
import {analyze, applyCurrentLanguageId, storeAvailableLanguages} from './ui';
import {uploadsListReceive} from './fileUpload';
import * as i18n from '../utils/i18n';

/*
 * action types
 */
export const RECEIVE_USERDATA = 'RECEIVE_USERDATA';
export const REQUEST_USERDATA = 'REQUEST_USERDATA';

const dataClient = apiFacade.dataClient;

/*
 * action creators
 */

function requestUserData() {
    return {
        type: REQUEST_USERDATA
    };
}

function receiveUserData(profileMetadata) {
    return {
        type: RECEIVE_USERDATA,
        profileMetadata,
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
            ({error, response}) => {
                const p = getP(getState());
                return dispatch(handleApiResponseErrorAsync(p.t('errors.fetchUserDataNetworkError'), error, response));
            }
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
                uploads,
                languages,
                profileMetadata
            } = userData;

            dispatch(receiveUserData(profileMetadata));
            dispatch(storeAvailableLanguages(languages));
            dispatch(applyCurrentLanguageId(profileMetadata.defaultLanguageId));
            dispatch(filtersListReceive(filters));
            dispatch(viewsListReceive(views));
            dispatch(modelsListReceive(models));

            dispatch(receiveSavedFilesList(savedFiles));
            dispatch(receiveTotalFields(totalFields));
            dispatch(receiveMetadata(metadata));
            dispatch(receiveSamplesList(samples));
            dispatch(receiveInitialAnalysesHistory(analyses));
            dispatch(uploadsListReceive(uploads));

            dispatch(createNewDefaultHistoryItem());
            const lastHistoryAnalysis = analyses[0];
            dispatch(setCurrentAnalysesHistoryIdLoadDataAsync(lastHistoryAnalysis ? lastHistoryAnalysis.id : null))
                .then(() => {
                    const currentAnalysis = lastHistoryAnalysis || getState().analysesHistory.newHistoryItem;
                    const {
                        type, samples, viewId, filterId, modelId
                    } = currentAnalysis;
                    const {name, description} = i18n.getEntityText(currentAnalysis, languageId);
                    const searchParams = i18n.setEntityText( // TODO looks like making new analysis, see AnalysisRightPane
                        {
                            id: lastHistoryAnalysis ? lastHistoryAnalysis.id : null,
                            type,
                            samples,
                            viewId,
                            filterId,
                            modelId
                        },
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
