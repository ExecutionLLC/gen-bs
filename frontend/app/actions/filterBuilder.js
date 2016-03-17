import config from '../../config'

import { closeModal } from './modalWindows'
import { changeFilter} from './ui'
import { fetchFilters } from './userData'

export const FBUILDER_SELECT_FILTER = 'FBUILDER_SELECT_FILTER'

export const FBUILDER_CHANGE_ATTR = 'FBUILDER_CHANGE_ATTR'

export const FBUILDER_TOGGLE_NEW_EDIT = 'FBUILDER_TOGGLE_NEW_EDIT'

export const FBUILDER_REQUEST_UPDATE_FILTER = 'FBUILDER_REQUEST_UPDATE_FILTER'
export const FBUILDER_RECEIVE_UPDATE_FILTER = 'FBUILDER_RECEIVE_UPDATE_FILTER'

export const FBUILDER_REQUEST_CREATE_FILTER = 'FBUILDER_REQUEST_CREATE_FILTER'
export const FBUILDER_RECEIVE_CREATE_FILTER = 'FBUILDER_RECEIVE_CREATE_FILTER'

export const FBUILDER_REQUEST_RULES = 'FBUILDER_REQUEST_RULES'
export const FBUILDER_RECEIVE_RULES = 'FBUILDER_RECEIVE_RULES'


/*
 * Action Creators
 */
export function filterBuilderToggleNewEdit(editOrNew) {
    return {
        type: FBUILDER_TOGGLE_NEW_EDIT,
        editOrNew
    }
}

export function filterBuilderSelectFilter(filters, filterId, editOrNew) {
    return {
        type: FBUILDER_SELECT_FILTER,
        filters,
        filterId,
        editOrNew
    }
}

export function filterBuilderChangeAttr(attr) {
    return {
        type: FBUILDER_CHANGE_ATTR,
        name: attr.name,
        description: attr.description
    }
}

function filterBuilderRequestCreateFilter() {
    return {
        type: FBUILDER_REQUEST_CREATE_FILTER
    }
}

function filterBuilderReceiveCreateFilter(json) {
    return {
        type: FBUILDER_RECEIVE_CREATE_FILTER,
        filter: json
    }
}

export function filterBuilderCreateFilter() {

    return (dispatch, getState) => {
        dispatch(filterBuilderRequestUpdateFilter())

        return $.ajax(config.URLS.FILTERS, {
                'type': 'POST',
                'headers': {"X-Session-Id": getState().auth.sessionId},
                'data': JSON.stringify(getState().filterBuilder.newFilter),
                'processData': false,
                'contentType': 'application/json'
            })
            .done(json => {
                dispatch(filterBuilderReceiveUpdateFilter(json))
                dispatch(closeModal('filters'))
                dispatch(fetchFilters(json.id))
            })
            .fail(err => {
                console.error('CREATE Filter FAILED: ', err.responseText)
            })
    }
}

function filterBuilderRequestUpdateFilter() {
    return {
        type: FBUILDER_REQUEST_UPDATE_FILTER
    }
}

function filterBuilderReceiveUpdateFilter(json) {
    return {
        type: FBUILDER_RECEIVE_UPDATE_FILTER,
        filter: json
    }
}

export function filterBuilderUpdateFilter() {

    return (dispatch, getState) => {
        dispatch(filterBuilderRequestUpdateFilter())

        return $.ajax(`${config.URLS.FILTERS}/${getState().filterBuilder.editedFilter.id}`, {
                'type': 'PUT',
                'headers': {"X-Session-Id": getState().auth.sessionId},
                'data': JSON.stringify(getState().filterBuilder.editedFilter),
                'processData': false,
                'contentType': 'application/json'
            })
            .done(json => {
                dispatch(filterBuilderReceiveUpdateFilter(json))
                dispatch(closeModal('filters'))
                dispatch(fetchFilters(json.id))
            })
            .fail(err => {
                console.error('UPDATE Filter FAILED: ', err.responseText)
            })
    }
}

export function filterBuilderRequestRules() {
    return {
        type: FBUILDER_REQUEST_RULES
    }
}

export function filterBuilderReceiveRules(rules) {
    return (dispatch, getState) => {
        dispatch(filterBuilderRules(rules))
        getState().filterBuilder.editOrNew ?
            dispatch(filterBuilderUpdateFilter()) : dispatch(filterBuilderCreateFilter())
    }
}

export function filterBuilderRules(rules) {
    return {
        type: FBUILDER_RECEIVE_RULES,
        rules,
        rulesPrepared: true,
        rPromise: function (resolve, reject) {
            resolve(777)
        }
    }
}



