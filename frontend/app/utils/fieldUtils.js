export default class FieldUtils {
    static find(fieldId, fields) {
        return _.find(fields.list, (field) => field.id === fieldId) ||
            _.find(fields.sourceFieldsList, (field) => field.id === fieldId);
    }
}