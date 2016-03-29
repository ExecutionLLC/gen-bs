import { fetchVariants, clearSearchParams } from './variantsTable'
import { requestAnalyze , requestChangeView} from './websocket'
import { viewBuilderSelectView } from './viewBuilder'
import { filterBuilderSelectFilter} from './filterBuilder'

export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR'

export const CHANGE_SAMPLE = 'CHANGE_SAMPLE'
export const CHANGE_HEADER_VIEW = 'CHANGE_HEADER_VIEW'
export const CHANGE_HEADER_FILTER = 'CHANGE_HEADER_FILTER'

export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE'

export const ANALYZE = 'ANALYZE'
export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP'


/*
 * Action Creators
 */
export function toggleQueryNavbar(samples, sampleId) {
    return {
        type: TOGGLE_QUERY_NAVBAR
    }
}

export function changeSample(samples, sampleId) {
    return {
        type: CHANGE_SAMPLE,
        samples,
        sampleId
    }
}

export function updateSampleValue(sampleId, valueFieldId, value) {
    return {
        type: UPDATE_SAMPLE_VALUE,
        sampleId,
        valueFieldId,
        value
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
        dispatch(changeHeaderView(getState().userData.views, viewId))
        dispatch(viewBuilderSelectView(getState().userData.views, viewId, true))
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
        dispatch(changeHeaderFilter(getState().userData.filters, filterId))
        dispatch(filterBuilderSelectFilter(getState().userData.filters, filterId, true))
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
        }

        dispatch(clearSearchParams())

        dispatch(requestAnalyze(searchParams))

        const searchView = _.find(getState().ui.views , {id: viewId});

        dispatch(requestChangeView(searchView))

        dispatch(fetchVariants(searchParams))

    }
}

export function toggleAnalyzeTooltip(flag) {
    return {
        type: TOGGLE_ANALYZE_TOOLTIP,
        isAnalyzeTooltipVisible: flag
    }
}
