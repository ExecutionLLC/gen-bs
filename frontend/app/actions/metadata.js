
export const RECEIVE_METADATA = 'RECEIVE_METADATA';

/*
 * action creators
 */

export function receiveMetadata(json) {
    return {
        type: RECEIVE_METADATA,
        fields: json,
        receivedAt: Date.now()
    };
}