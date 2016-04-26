export default class FieldUtils {
    static find(fieldId, fields) {
        return _.find(fields.totalFieldsList, (field) => field.id === fieldId);
    }
    /**
     * Make field structure usable for filters dialog purpposes
     * @param {{id: string, label: string, sourceName: string, valueType: string}} f
     * @param {string=} sourceName
     * @returns {{id: string, label: string, type: string}}
     */
    static makeFieldSelectItemValue(f, sourceName) {
        return {
            id: f.id,
            label: `${f.label} -- ${(sourceName == null ? f.sourceName : sourceName)}`,
            type: f.valueType === 'float' ? 'double' : f.valueType
        };
    }
    /**
     * Make fields array for filters
     * @param {{notEditableFields: Object[], sourceFieldsList: Object[], totalFieldsList: Object[], sampleFieldsList: Object[]}} fields
     * @returns {{id: string, label: string, type: string}[]}
     */
    static makeFieldsListForFiltersSelect(fields) {
        const allAvailableFields = _.filter(fields.sampleFieldsList.concat(fields.sourceFieldsList), field => !field.isEditable);
        return allAvailableFields.map( (f) => this.makeFieldSelectItemValue(f) );
    }
    /**
     * Return default field id for adding new rule item or smth
     * @param {{id: string, label: string, type: string}[]} fields
     * @returns {string}
     */
    static getDefaultId(fields) {
        return fields[0].id;
    }
    /**
     * Get JS type for the field value or undefined
     * @param {{id: string, label: string, type: string}} field
     * @returns {string|undefined}
     */
    static getFieldJSType(field) {
        const fieldType = field.type;
        const jsType = {
            'char': 'string',
            'string': 'string',
            'integer': 'number',
            'float': 'number',
            'double': 'number',
            'boolean': 'boolean'
        }[fieldType];
        return jsType;
    }
    /**
     * Return field for id
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {string} id
     * @returns {{id: string, label: string, type: string}|null}
     */
    static getFieldById(fields, id) {
        var i;
        for (i = 0; i < fields.length; i++) {
            if (id == fields[i].id) {
                return fields[i];
            }
        }
        return null;
    }

}