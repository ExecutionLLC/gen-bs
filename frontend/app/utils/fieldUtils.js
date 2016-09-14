import _ from 'lodash';

import SamplesUtils from './samplesUtils';
import  {firstCharToUpperCase} from './stringUtils';

export default class FieldUtils {
    static find(fieldId, fields) {
        return fields.totalFieldsHashedArray.hash[fieldId];
    }

    static isSourceField(field) {
        return field.sourceName !== 'sample';
    }

    static makeFieldSourceCaption(field, sourceName) {
        var label;

        if (field.sampleType) {
            label = `(${SamplesUtils.typeLabels[field.sampleType]}) ${field.label}`;
        } else {
            if (sourceName) {
                label = `${field.label} -- ${sourceName}`;
            } else {
                label = `${field.label} -- ${field.sourceName}`;
            }
        }

        return label;
    }

    static makeFieldSavedCaption(field, sampleType) {
        return field.label + (field.sourceName && this.isSourceField(field) ? ` - ${field.sourceName}` : sampleType ? ` - ${sampleType}` : '');
    }

    static makeFieldViewsCaption(field) {
        return `${field.label} -- ${field.sourceName}`;
    }

    static makeFieldVariantsLabelTitle(field, sampleName, sampleType) {
        const {sourceName, label} = field;
        const isSource = sourceName && this.isSourceField(field);
        return {
            label: (!isSource && sampleType ? `(${sampleType})` : '') + firstCharToUpperCase(label),
            title: isSource ? sourceName : sampleName
        };
    }

    /**
     * Make field structure usable for filters dialog purposes
     * @param {{id: string, label: string, sampleType: string=, sourceName: string, valueType: string}} f
     * @param {string=} sourceName
     * @returns {{id: string, label: string, type: string}}
     */
    static makeFieldSelectItemValue(f, sourceName) {

        var label = this.makeFieldSourceCaption(f, sourceName);

        return {
            id: f.id,
            label,
            sampleType: f.sampleType,
            type: f.valueType === 'float' ? 'double' : f.valueType
        };
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
     * Get validation regex for the field value or undefined
     * @param {{id: string, label: string, type: string}} field
     * @returns {string|undefined}
     */
    static getFieldInputValidationRegex(field){
        const fieldType = field.type;
        const jsType = {
            'char': '^((?!,).)*$',
            'string': '^((?!,).)*$',
            'integer': null,
            'float': null,
            'double': null,
            'boolean': null
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

    /**
     * Return all fields as array from sample.values.
     * @template {TField}
     * @param {{values: {filedId: string}[]}} sample
     * @param {Object.<string, TField>} totalFieldsHash
     * @returns {Object.<string, TField>}
     */
    static getSampleFields(sample, totalFieldsHash) {
        const sampleValues = sample.values;
        const sampleFields = sampleValues.map(({fieldId}) => totalFieldsHash[fieldId]);
        return sampleFields;
    }

    static ridOfVepFields(fields) {
        return _.filter(fields, (field) => !field.name.startsWith('VEP_'));
    }

    static sortAndAddLabels(fields) {
        // Patch field label because it may not exist
        function updateFieldLabelIfNeeded(field) {
            return Object.assign({}, field, {
                label: field.label ? field.label : field.name
            });
        }

        return fields.map(updateFieldLabelIfNeeded)
            .sort((a, b) => {
                if (a.label > b.label) {return 1;}
                if (a.label < b.label) {return -1;}
                return 0;
            });
    }

    static makeViewFilterAllowedFields(samples, totalFieldsHash, sourceFieldsList) {
        const samplesFields = samples.map((sample) => FieldUtils.getSampleFields(sample, totalFieldsHash));
        return FieldUtils.makeAllowedFieldsForSamplesFields(samplesFields, sourceFieldsList);
    }

    static makeAllowedFieldsForSamplesFields(samplesFields, sourceFieldsList) {
        const allSamplesFields = _.unionBy.apply(_, [...samplesFields, ...[(sample) => sample.id]]);
        const sortedLabelledFields = FieldUtils.sortAndAddLabels(allSamplesFields);
        return [
            ..._.filter(sortedLabelledFields, ['isEditable', false]),
            ...sourceFieldsList
        ];
    }

    /**
     * @param {{id: string, values: {fieldId: string}[]}[]} samples
     * @param {Object.<string, string>} samplesTypes hash {sampleId: sampleType}
     * @param {Object} totalFieldsHash hash {fieldId: field}
     * @returns {Array}
     */
    static makeModelAllowedFields(samples, samplesTypes, totalFieldsHash) {

        function addSampleTypeFields(fields, sampleType) {
            return _.map(fields, (field) => ({
                ...field,
                sampleType
            }));
        }

        const samplesFields = samples.map((sample, index) => {
            const sampleType = samplesTypes[sample.id];
            const sampleFields = FieldUtils.getSampleFields(sample, totalFieldsHash);
            if (index) {
                return addSampleTypeFields(sampleFields, sampleType);
            } else {
                return addSampleTypeFields(FieldUtils.ridOfVepFields(sampleFields), sampleType);
            }
        });
        const allSamplesFields = _.concat.apply(_, samplesFields);
        const sortedLabelledFields = FieldUtils.sortAndAddLabels(allSamplesFields);
        return _.filter(sortedLabelledFields, ['isEditable', false]);
    }
}