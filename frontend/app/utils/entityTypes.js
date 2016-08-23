export const entityType = {
    USER: 'user',
    STANDARD: 'standard',
    ADVANCED: 'advanced',
    HISTORY: 'history',
    DEFAULT: 'default'
};

export function entityTypeIsEditable(type) {
    return type === entityType.USER;
}

export function entityTypeIsDemoDisabled(type, isDemoUser) {
    return isDemoUser && type == entityType.ADVANCED;
}