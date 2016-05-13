import {fetchVariants, clearSearchParams} from './variantsTable';
import {requestAnalyze, requestSetCurrentParams} from './websocket';
import {viewBuilderSelectView} from './viewBuilder';
import {detachHistory} from "./queryHistory";
import {setViewVariantsSort} from "./variantsTable";
import {handleError} from './errorHandler'


export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR';

export const CHANGE_HEADER_VIEW = 'CHANGE_HEADER_VIEW';
export const CHANGE_HEADER_FILTER = 'CHANGE_HEADER_FILTER';

export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

export const REQUEST_TABLE_SCROLL_POSITION_RESET = 'REQUEST_TABLE_SCROLL_POSITION_RESET';
export const COMPLETE_TABLE_SCROLL_POSITION_RESET = 'COMPLETE_TABLE_SCROLL_POSITION_RESET';

const ANALIZE_PARAMS_ERROR = 'Cannot start analysis process with empty parameters.';

export function requestTableScrollPositionReset() {
    return {
        type: REQUEST_TABLE_SCROLL_POSITION_RESET
    }
}

export function completeTableScrollPositionReset() {
    return {
        type: COMPLETE_TABLE_SCROLL_POSITION_RESET
    }
}

/*
 * Action Creators
 */
export function toggleQueryNavbar() {
    return {
        type: TOGGLE_QUERY_NAVBAR
    }
}

function changeHeaderView(views, viewId) {
    return {
        type: CHANGE_HEADER_VIEW,
        views,
        viewId
    }
}

export function changeView(viewId) {
    return (dispatch, getState) => {
        const {userData: {views}} = getState();
        dispatch(changeHeaderView(views, viewId));
        dispatch(viewBuilderSelectView(views, viewId));
    }
}

export function changeHeaderFilter(filters, filterId) {
    return {
        type: CHANGE_HEADER_FILTER,
        filters,
        filterId
    }
}

export function changeFilter(filterId) {
    return (dispatch, getState) => {
        const {userData: {filters}} = getState();
        dispatch(changeHeaderFilter(filters, filterId));
    }
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
                attachedHistoryData: historyData,
                views,
                filters
            },
            samplesList: {
                samples
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
        const searchView = _.find(views, {id: viewId});
        const searchSample = _.find(samples, {id: sampleId});
        const searchFilter = _.find(filters, {id: filterId});
        dispatch(requestSetCurrentParams(searchView, searchFilter, searchSample, sampleFieldsList));
        dispatch(setViewVariantsSort(searchView));
        dispatch(fetchVariants(searchParams))
    }
}
