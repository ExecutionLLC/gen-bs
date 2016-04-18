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
}