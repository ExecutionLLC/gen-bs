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
    static getFieldValue(f, sourceName) {
        return {
            id: f.id,
            label: `${f.label} -- ${(sourceName == null ? f.sourceName : sourceName)}`,
            type: f.valueType === 'float' ? 'double' : f.valueType
        };
    }
    /**
     * Make fields array for filters
     * @param {{notEditableFields: Object[], sourceFieldsList: Object[]}} fields
     * @returns {{id: string, label: string, type: string}[]}
     */
    static makeFieldsList(fields) {

        /*
         There was two arrays:

         at componentDidMount:
         ...fields.notEditableFields.map( (f) => { return {id: f.id, label: `${f.name} -- ${f.sourceName}`, type: f.valueType === 'float' ? 'double' : f.valueType} } ),
         ...fields.sourceFieldsList.filter((f) => (f.sourceName !== 'sample')).map( (f) => { return {id: f.id, label: `${f.name} -- source`, type: f.valueType === 'float' ? 'double' : f.valueType }} )

         at componentWillUpdate:
         ...fields.sampleFieldsList.map( (f) => { return {id: f.id, label: `${f.label} -- ${f.sourceName}`, type: f.valueType === 'float' ? 'double' : f.valueType} } ),
         ...fields.sourceFieldsList.filter((f) => (f.sourceName !== 'sample')).map( (f) => { return {id: f.id, label: `${f.label} -- source`, type: f.valueType === 'float' ? 'double' : f.valueType }} )

         1st part is from 'notEditableFields' at 'componentDidMount' vs 'sampleFieldsList' at 'componentWillUpdate'
         and all '.name' at componentDidMount vs '.label' at 'componentWillUpdate'

         There must be not editable fields to prevent select gender for the person
         */

        return [
            ...fields.notEditableFields.map( (f) => this.getFieldValue(f) ),
            ...fields.sourceFieldsList.filter( (f) => (f.sourceName !== 'sample') ).map( (f) => this.getFieldValue(f, 'source') )
        ];
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
     * @returns {{id: string, label: string, type: string}}
     */
    static getFieldById(fields, id) {
        var i;
        for (i = 0; i < fields.length; i++) {
            if (id == fields[i].id) {
                return fields[i];
            }
        }
    }

}