/*
 * action types
 */

export const OPEN_MODAL = 'OPEN_MODAL';
export const CLOSE_MODAL = 'CLOSE_MODAL';


/**
 * modals
 */

export const modalName = {
    FILTERS: 'filters',
    VIEWS: 'views',
    UPLOAD: 'upload',
    ANALYSIS: 'analysis'
};


/*
 * Action creators
 */

export function openModal(modalName) {
    return {
        type: OPEN_MODAL,
        modalName
    };
}

export function closeModal(modalName) {
    return {
        type: CLOSE_MODAL,
        modalName
    };
}
