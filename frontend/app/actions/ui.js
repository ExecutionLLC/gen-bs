import _ from 'lodash';
import HttpStatus from 'http-status';
import {setLanguage} from 'redux-polyglot/dist/actions';

import {
    fetchVariantsAsync,
    clearSearchParams,
    setViewVariantsSort
} from './variantsTable';
import {
    requestAnalyze,
    requestSetCurrentParams
} from './websocket';
import apiFacade from '../api/ApiFacade';


import en from '../lang/en';
import ru from '../lang/ru';

const languages = {
    en,
    ru
};

const usersClient = apiFacade.usersClient;

export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

export const REQUEST_TABLE_SCROLL_POSITION_RESET = 'REQUEST_TABLE_SCROLL_POSITION_RESET';
export const COMPLETE_TABLE_SCROLL_POSITION_RESET = 'COMPLETE_TABLE_SCROLL_POSITION_RESET';
export const STORE_CURRENT_LANGUAGE_ID = 'STORE_CURRENT_LANGUAGE_ID';
export const STORE_AVAILABLE_LANGUAGES = 'STORE_AVAILABLE_LANGUAGES';

export function requestTableScrollPositionReset() {
    return {
        type: REQUEST_TABLE_SCROLL_POSITION_RESET
    };
}

export function completeTableScrollPositionReset() {
    return {
        type: COMPLETE_TABLE_SCROLL_POSITION_RESET
    };
}

/*
 * Action Creators
 */

/**
 * @param {{id: string?, type: string, samples: {id: string, type: string}[], viewId: string, filterId: string, modelId: string?, text: {name: string, description: string, languageId: ?string}[]}} searchParams
 * @returns {function(*, *)}
 */
export function analyze(searchParams) {
    return (dispatch, getState) => {
        const {
            samplesList: {
                hashedArray: {hash: sampleIdToSampleHash}
            },
            filtersList: {
                hashedArray: {hash: filterIdToFilterHash}
            },
            modelsList: {
                hashedArray: {hash: modelIdToFilterHash}
            },
            viewsList: {
                hashedArray: {hash: viewIdToViewHash}
            }
        } = getState();

        const searchParamsWithLimitsOffset = {
            analyze: searchParams,
            limit: 100,
            offset: 0
        };

        dispatch(requestTableScrollPositionReset());
        dispatch(clearSearchParams());
        dispatch(requestAnalyze());
        return new Promise((resolve, reject) => {
            dispatch(fetchVariantsAsync(searchParamsWithLimitsOffset)).then((result) => {
                const searchView = viewIdToViewHash[searchParams.viewId];
                const searchSamples = _.map(searchParams.samples, (sample) => sampleIdToSampleHash[sample.id]);
                const searchFilter = filterIdToFilterHash[searchParams.filterId];
                const searchModel = searchParams.modelId ?
                    modelIdToFilterHash[searchParams.modelId] :
                    null;
                const searchAnalysis = result.analysis;
                dispatch(requestSetCurrentParams(searchView, searchFilter, searchSamples, searchModel, searchAnalysis || searchParams));
                dispatch(setViewVariantsSort(searchView, searchParams.samples));
                resolve(searchAnalysis);
            }).catch((error) => reject(error));
        });
    };
}

export function storeCurrentLanguageId(languageId) {
    return {
        type: STORE_CURRENT_LANGUAGE_ID,
        languageId
    };
}

export function setCurrentLanguageId(languageId) {
    return (dispatch, getState) => {
        const {userData: {profileMetadata}, auth: {isDemo}} = getState();

        dispatch(storeCurrentLanguageId(languageId));
        dispatch(setLanguage(languageId, languages[languageId]));

        if (profileMetadata.defaultLanguageId === languageId || isDemo) {
            return Promise.resolve();
        } else {
            const userToUpdate = profileMetadata;
            userToUpdate.defaultLanguageId = languageId;
            return new Promise(
                (resolve) => {
                    usersClient.update(userToUpdate, (error, response) => resolve({error, response}));
                }).then(({error, response}) => {
                    let errorMsg = null;
                    if (error) {
                        errorMsg = error.message;
                    } else if (!response.body) {
                        errorMsg = response.text;
                    } else if (response.status !== HttpStatus.OK) {
                        errorMsg = response.body ? response.body.message : response.text;
                    }
                    if (errorMsg) {
                        console.error(`Failed to update user's default language: ${errorMsg}`);
                    }
                }).catch((error) => {
                    console.error(`Failed to update user's default language: ${error}`);
                });
        }
    };
}

export function storeAvailableLanguages(languages) {
    return {
        type: STORE_AVAILABLE_LANGUAGES,
        languages
    };
}
