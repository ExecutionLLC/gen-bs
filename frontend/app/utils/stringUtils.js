import {entityType} from './entityTypes';

// see http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
export function getUrlParameterByName(name, url) {
    if (!url) {
        url = location.href;
    }
    // This is just to avoid case sensitiveness
    url = url.toLowerCase();
    // This is just to avoid case sensitiveness for query parameter name
    name = name.replace(/[\[\]]/g, '\\$&').toLowerCase();
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    var results = regex.exec(url);
    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

export function getItemLabelByNameAndType(itemName, itemType) {
    return itemType === entityType.HISTORY ? itemName + ' (from history)' : itemName;
}

export function getReadonlyReasonForSessionAndType(what, isDemoSession, selectedViewFilterType) {
    switch (selectedViewFilterType) {
        case entityType.HISTORY:
            return `This ${what} is history ${what}, duplicate it to make changes.`;
        case entityType.USER:
            return '';
    }
    const descriptionText = `This ${what} is not editable, duplicate it to make changes.`;
    if (isDemoSession) {
        return descriptionText + ' (Only for registered users)';
    } else {
        return descriptionText;
    }
}