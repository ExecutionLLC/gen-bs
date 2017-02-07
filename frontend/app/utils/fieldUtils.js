import _ from 'lodash';

import * as SamplesUtils from './samplesUtils';
import {isMainSample} from './samplesUtils';
import * as i18n from './i18n';

export default class FieldUtils {
    static find(fieldId, fields) {
        return fields.totalFieldsHashedArray.hash[fieldId];
    }

    static getDefaultLinkIdentity(){
        return '###DATA###';
    }

    static isSourceField(field) {
        return field.sourceName !== 'sample';
    }

    static getFieldLabel(field, languageId) {
        const fieldText = i18n.getEntityText(field, languageId);
        if (!fieldText || !fieldText.label) {
            return field.name; // long time ago there was no labels, so there were this check, I left it for stability
        } else {
            return fieldText.label;
        }
    }

    /**
     * Make field structure usable for filters dialog purposes
     * @param {{id: string, label: string, sampleType: string=, sourceName: string, valueType: string}} field
     * @param {string=} sourceName
     * @param {string} languageId
     * @param {Object.<string, string>} typeLabels
     * @returns {{id: string, label: string, type: string}}
     */
    static makeFieldSourceCaption(field, sourceName, languageId, typeLabels) {
        const fieldLabel = this.getFieldLabel(field, languageId);
        var label;

        if (field.sampleType) {
            label = `(${typeLabels[field.sampleType]}) ${fieldLabel}`;
        } else {
            if (sourceName) {
                label = `${fieldLabel} -- ${sourceName}`;
            } else {
                label = `${fieldLabel} -- ${field.sourceName}`;
            }
        }

        return label;
    }

    static makeFieldSavedCaption(field, sampleType, languageId) {
        const fieldLabel = this.getFieldLabel(field, languageId);
        return fieldLabel + (field.sourceName && this.isSourceField(field) ? ` - ${field.sourceName}` : sampleType ? ` - ${sampleType}` : '');
    }

    static makeFieldViewsCaption(field, languageId) {
        const fieldLabel = this.getFieldLabel(field, languageId);
        return `${fieldLabel} -- ${field.sourceName}`;
    }

    static makeFieldVariantsLabelTitle(field, sampleName, sampleType, languageId) {
        const fieldLabel = this.getFieldLabel(field, languageId);
        const {sourceName, isUnique} = field;
        const isSource = sourceName && this.isSourceField(field);
        return {
            label: `${(!isSource && sampleType && !isUnique ? `(${sampleType})` : '')}${fieldLabel}`,
            title: isSource ? sourceName : sampleName
        };
    }

    /**
     * Make field structure usable for filters dialog purposes
     * @param {{id: string, label: string, sampleType: string=, sourceName: string, valueType: string}} field
     * @returns {{id: string, label: string, type: string}}
     */
    static makeFieldTyped(field) {
        return {
            id: field.id,
            sampleType: field.sampleType,
            type: field.valueType === 'float' ? 'double' : field.valueType
        };
    }

    /**
     * Make field structure usable for filters dialog purposes
     * @param {{id: string, label: string, sampleType: string=, sourceName: string, valueType: string}} field
     * @param {string=} sourceName
     * @param {string} languageId
     * @param {Object.<string, string>} typeLabels
     * @returns {{id: string, label: string, type: string}}
     */
    static makeFieldSelectItemValue(field, sourceName, languageId, typeLabels) {

        var label = this.makeFieldSourceCaption(field, sourceName, languageId, typeLabels);

        return {
            id: field.id,
            label,
            sampleType: field.sampleType,
            type: field.valueType === 'float' ? 'double' : field.valueType
        };
    }

    static makeFieldTypeLabels(p) {
        const abbrPath = 'analysis.rightPane.sampleTypeAbbr.';
        return _(SamplesUtils.sampleType)
            .mapKeys(type => type)
            .mapValues(type => p.t(`${abbrPath}${type}`))
            .value();
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
            'char': null,
            'string': null,
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
        const sampleValues = sample.sampleFields;
        const sampleFields = sampleValues.map(({fieldId}) => totalFieldsHash[fieldId]);
        return sampleFields;
    }

    static excludeVepFieldsButZygocityGenotype(fields, sampleType) {
        // TODO remove VEP exceptions when there fields will be renamed
        if ( isMainSample(sampleType)){
            return fields;
        }
        return _.filter(fields, (field) => !field.name.startsWith('VEP_') || field.name === 'VEP_Zygosity' || field.name === 'VEP_Genotype');
    }

    static sortByLabels(fields, languageId) {
        return fields.slice().sort((a, b) => {
            const fieldLabelA = this.getFieldLabel(a, languageId);
            const fieldLabelB = this.getFieldLabel(b, languageId);
            if (fieldLabelA > fieldLabelB) {return 1;}
            if (fieldLabelA < fieldLabelB) {return -1;}
            return 0;
        });
    }

    static makeViewFilterAllowedFields(samples, totalFieldsHash, sourceFieldsList, languageId) {
        const samplesFields = samples.map((sample) => FieldUtils.getSampleFields(sample, totalFieldsHash));
        return FieldUtils.makeAllowedFieldsForSamplesFields(samplesFields, sourceFieldsList, languageId).filter((field) => !field.isInvisible);
    }

    static makeAllowedFieldsForSamplesFields(samplesFields, sourceFieldsList, languageId) {
        const allSamplesFields = _.unionBy.apply(_, [...samplesFields, ...[(sample) => sample.id]]);
        const sortedFields = FieldUtils.sortByLabels(allSamplesFields, languageId);
        return [
            ...sortedFields,
            ...sourceFieldsList
        ];
    }

    /**
     * @param {{id: string, values: {fieldId: string}[]}[]} samples
     * @param {Object.<string, string>} samplesTypes hash {sampleId: sampleType}
     * @param {Object} totalFieldsHash hash {fieldId: field}
     * @param {string} languageId
     * @returns {Array}
     */
    static makeModelAllowedFields(samples, samplesTypes, totalFieldsHash, languageId) {
        function addSampleTypeFields(fields, sampleType) {
            return _.map(fields, (field) => ({
                ...field,
                sampleType
            }));
        }

        const samplesFields = samples.map((sample) => {
            const sampleType = samplesTypes[sample.id];
            const sampleFields = FieldUtils.getSampleFields(sample, totalFieldsHash);
            return addSampleTypeFields(FieldUtils.excludeVepFieldsButZygocityGenotype(sampleFields, sampleType), sampleType);
        });
        const allSamplesFields = _.concat.apply(_, samplesFields);
        const sortedFields = FieldUtils.sortByLabels(allSamplesFields, languageId);
        return _.filter(sortedFields, (field) => !field.isInvisible);
    }
}