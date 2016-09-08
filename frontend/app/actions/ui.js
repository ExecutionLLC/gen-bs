import _ from 'lodash';

import {
    fetchVariants,
    clearSearchParams,
    setViewVariantsSort
} from './variantsTable';
import {
    requestAnalyze,
    requestSetCurrentParams
} from './websocket';


export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

export const REQUEST_TABLE_SCROLL_POSITION_RESET = 'REQUEST_TABLE_SCROLL_POSITION_RESET';
export const COMPLETE_TABLE_SCROLL_POSITION_RESET = 'COMPLETE_TABLE_SCROLL_POSITION_RESET';


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

        const searchParamsLO = {
            analyze: searchParams,
            limit: 100,
            offset: 0
        };

        dispatch(requestTableScrollPositionReset());
        dispatch(clearSearchParams());
        dispatch(requestAnalyze());
        return new Promise((resolve, reject) => {
            dispatch(fetchVariants(searchParamsLO)).then((result) => {
                const searchView = viewIdToViewHash[searchParams.viewId];
                const searchSamples = _.map(searchParams.samples, (sample) => sampleIdToSampleHash[sample.id]);
                const searchFilter = filterIdToFilterHash[searchParams.filterId];
                const searchModel = searchParams.modelId && modelIdToFilterHash[searchParams.modelId] || null;
                const searchAnalysis = result.analysis;
                dispatch(requestSetCurrentParams(searchView, searchFilter, searchSamples, searchModel, searchAnalysis || searchParams));
                dispatch(setViewVariantsSort(searchView, searchParams.samples));
                resolve(searchAnalysis);
            }).catch((error) => reject(error));
        });
    };
}
