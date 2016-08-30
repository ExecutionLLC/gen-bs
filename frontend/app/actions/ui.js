import {fetchVariants, clearSearchParams} from './variantsTable';
import {requestAnalyze, requestSetCurrentParams} from './websocket';
//import {detachHistory} from './queryHistory';
import {
    setViewVariantsSort,
    changeExcludedFields
} from './variantsTable';
//import {handleError} from './errorHandler';
import * as _ from 'lodash';


export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

export const REQUEST_TABLE_SCROLL_POSITION_RESET = 'REQUEST_TABLE_SCROLL_POSITION_RESET';
export const COMPLETE_TABLE_SCROLL_POSITION_RESET = 'COMPLETE_TABLE_SCROLL_POSITION_RESET';

//const ANALIZE_PARAMS_ERROR = 'Cannot start analysis process with empty parameters.';


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
 * @param {{id: string?, name: string, description: string, type: string, samples: {id: string, type: string}[], viewId: string, filterId: string, modelId: string?}} searchParams
 * @returns {function(*, *)}
 */
export function analyze(searchParams) {
    return (dispatch, getState) => {
        // TODO validate params
        // if (!searchParams.samples || !searchParams.viewId || !searchParams.filterId) {
        //     dispatch(handleError(null, ANALIZE_PARAMS_ERROR));
        //     return;
        // }
        const {
            // userData: {
            //     attachedHistoryData: historyData
            // },
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
            },
            fields: {
                sampleFieldsHashedArray: {array: sampleFieldsList}
            }
        } = getState();

        // TODO rid of detachHistory
        // const detachHistorySample = historyData.sampleId ? historyData.sampleId !== searchParams.sampleId : false;
        // const detachHistoryFilter = historyData.filterId ? historyData.filterId !== searchParams.filterId : false;
        // const detachHistoryView = historyData.viewId ? historyData.viewId !== searchParams.viewId : false;
        // dispatch(detachHistory(detachHistorySample, detachHistoryFilter, detachHistoryView));

        const searchParamsLO = {
            analyze: searchParams,
            limit: 100,
            offset: 0
        };

        dispatch(requestTableScrollPositionReset());
        dispatch(clearSearchParams());
        dispatch(requestAnalyze());
        const searchView = viewIdToViewHash[searchParams.viewId];
        const searchSamples = _.map(searchParams.samples, (sample) => sampleIdToSampleHash[sample.id]);
        const searchFilter = filterIdToFilterHash[searchParams.filterId];
        const searchModel = searchParams.modelId && modelIdToFilterHash[searchParams.modelId] || null;
        dispatch(requestSetCurrentParams(searchView, searchFilter, searchSamples, searchModel, sampleFieldsList));
        dispatch(setViewVariantsSort(searchView));
        return new Promise((resolve, reject) => {
            dispatch(fetchVariants(searchParamsLO)).then((result) => {
                dispatch(changeExcludedFields(searchParams.viewId));
                resolve(result.analysis);
            }).catch((error) => reject(error));
        });
    };
}
