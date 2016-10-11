import _ from 'lodash';

export const entityType = {
    USER: 'user',
    STANDARD: 'standard',
    DEFAULT: 'default',
    ADVANCED: 'advanced',
    HISTORY: 'history'
};

export function entityTypeIsEditable(type) {
    return type === entityType.USER;
}

export function entityTypeIsDemoDisabled(type, isDemoUser) {
    return isDemoUser && type == entityType.ADVANCED;
}

export function getDefaultOrStandardItem(items) {
    return _.find(items, {type: entityType.DEFAULT}) || _.find(items, {type: entityType.STANDARD});
}