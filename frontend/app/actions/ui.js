import HttpStatus from 'http-status';

import { fetchVariants, clearSearchParams } from './variantsTable'
import { requestAnalyze , requestChangeView} from './websocket'
import { viewBuilderSelectView } from './viewBuilder'
import { filterBuilderSelectFilter} from './filterBuilder'
import { handleError } from './errorHandler'

import apiFacade from '../api/ApiFacade';


export const TOGGLE_QUERY_NAVBAR = 'TOGGLE_QUERY_NAVBAR';

export const CHANGE_SAMPLE = 'CHANGE_SAMPLE';
export const CHANGE_HEADER_VIEW = 'CHANGE_HEADER_VIEW';
export const CHANGE_HEADER_FILTER = 'CHANGE_HEADER_FILTER';

export const UPDATE_SAMPLE_VALUE = 'UPDATE_SAMPLE_VALUE';
export const UPDATE_SAMPLE_FIELDS = 'UPDATE_SAMPLE_FIELDS';

export const TOGGLE_ANALYZE_TOOLTIP = 'TOGGLE_ANALYZE_TOOLTIP';

export const INIT_SAMPLES_LIST = 'INIT_SAMPLES_LIST'
export const RESET_SAMPLES_LIST = 'RESET_SAMPLES_LIST'


const samplesClient = apiFacade.samplesClient;

const NETWORK_ERROR = 'Network error. You can reload page and try again.'
const SERVER_ERROR = 'Internal server error. You can reload page and try again.'


/*
 * Action Creators
 */
export function toggleQueryNavbar() {
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

export function requestUpdateSampleFields(sampleId, fields) {
    return (dispatch, getState) => {
        const {auth: {sessionId}, samplesList: {samples}} = getState();
        const currentSample = _.find(samples, {id: sampleId});
        console.log('currentSample =', currentSample);
        samplesClient.update(sessionId, currentSample, (error, response) => {
            console.log(' *** requestUpdateSampleFields.error: ', error);
            console.log(' *** requestUpdateSampleFields.response: ', response);
            if (error) {
                dispatch(handleError(null, NETWORK_ERROR));
            } else {
                if (response.status !== HttpStatus.OK) {
                    dispatch(handleError(null, SERVER_ERROR));
                } else {
                    const newSample = response.body;
                    console.log('newSample = ', newSample);
                    dispatch(updateSampleFields(sampleId, fields));
                }
            }

        });
    }
}

export function updateSampleFields(sampleId, fields) {
    return {
        type: UPDATE_SAMPLE_FIELDS,
        sampleId,
        fields,
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

export function initSamplesList(samples) {
    return {
        type: INIT_SAMPLES_LIST,
        samples: samples
    }
}

export function resetSamplesList(sampleId) {
    return {
        type: RESET_SAMPLES_LIST,
        sampleId,
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
