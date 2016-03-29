export default class FieldUtils {
    static find(fieldId, fields) {
        return _.find(fields.totalFieldsList, (field) => field.id === fieldId);
    }
}