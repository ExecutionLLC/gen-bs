import {fetchVariants, clearSearchParams} from './variantsTable';
import {requestAnalyze, requestSetCurrentParams} from './websocket';
import {detachHistory} from './queryHistory';
import {setViewVariantsSort} from './variantsTable';
import {handleError} from './errorHandler';


export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR';

export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

export const REQUEST_TABLE_SCROLL_POSITION_RESET = 'REQUEST_TABLE_SCROLL_POSITION_RESET';
export const COMPLETE_TABLE_SCROLL_POSITION_RESET = 'COMPLETE_TABLE_SCROLL_POSITION_RESET';

const ANALIZE_PARAMS_ERROR = 'Cannot start analysis process with empty parameters.';

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
export function toggleQueryNavbar() {
    return {
        type: TOGGLE_QUERY_NAVBAR
    };
}

export function analyze(sampleId, viewId, filterId, limit = 100, offset = 0) {
    return (dispatch, getState) => {
        if (!sampleId || !viewId || !filterId) {
            dispatch(handleError(null, ANALIZE_PARAMS_ERROR));
            return;
        }

        const searchParams = {
            sampleId,
            viewId,
            filterId,
            limit,
            offset
        };
        const {
            userData: {
                attachedHistoryData: historyData
            },
            samplesList: {
                hashedArray: {hash: sampleIdToSampleHash}
            },
            filtersList: {
                hashedArray: {hash: filterIdToFilterHash}
            },
            viewsList: {
                hashedArray: {hash: viewIdToViewHash}
            },
            fields: {
                sampleFieldsList
            }
        } = getState();

        const detachHistorySample = historyData.sampleId ? historyData.sampleId !== sampleId : false;
        const detachHistoryFilter = historyData.filterId ? historyData.filterId !== filterId : false;
        const detachHistoryView = historyData.viewId ? historyData.viewId !== viewId : false;
        dispatch(detachHistory(detachHistorySample, detachHistoryFilter, detachHistoryView));

        dispatch(requestTableScrollPositionReset());
        dispatch(clearSearchParams());
        dispatch(requestAnalyze(searchParams));
        const searchView = viewIdToViewHash[viewId];
        const searchSample = sampleIdToSampleHash[sampleId];
        const searchFilter = filterIdToFilterHash[filterId];
        dispatch(requestSetCurrentParams(searchView, searchFilter, searchSample, sampleFieldsList));
        dispatch(setViewVariantsSort(searchView));
        dispatch(fetchVariants(searchParams));
    };
}
