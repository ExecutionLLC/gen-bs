import { fetchVariants, clearSearchParams } from './variantsTable'
import { requestAnalyze , requestChangeView} from './websocket'
import { viewBuilderSelectView } from './viewBuilder'
import { filterBuilderSelectFilter} from './filterBuilder'


export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR';

export const CHANGE_HEADER_VIEW = 'CHANGE_HEADER_VIEW';
export const CHANGE_HEADER_FILTER = 'CHANGE_HEADER_FILTER';

export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

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
        dispatch(viewBuilderSelectView(views, viewId, true));
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
        dispatch(filterBuilderSelectFilter(filters, filterId, true));
    }
}

export function analyze(sampleId, viewId, filterId, limit = 100, offset = 0) {
    return (dispatch, getState) => {

        const searchParams = {
            sampleId: sampleId,
            viewId: viewId,
            filterId: filterId,
            limit: limit,
            offset: offset
        };

        dispatch(clearSearchParams());

        dispatch(requestAnalyze(searchParams));

        const searchView = _.find(getState().ui.views , {id: viewId});

        dispatch(requestChangeView(searchView));

        dispatch(fetchVariants(searchParams))

    }
}
