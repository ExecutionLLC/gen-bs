export const EXPORT_TO_FILE = 'EXPORT_TO_FILE'


/*
 * other constants
 */

export const fileTypes = {
    NONE: null,
    EXCEL: {type: 'xlsx', ext: 'xlsx'},
    CSV: {type: 'csv', ext: 'csv'},
    SQL: {type: 'sql', ext: 'sql'},
    JSON: {type: 'json', ext: 'json'},
    XML: {type: 'xml', ext: 'xml'}
}

/*
 * Action Creators
 */

export function exportToFile(fileType, fileName) {
    return {
        type: EXPORT_TO_FILE,
        fileType,
        fileName
    }
}

