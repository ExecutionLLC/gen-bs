import _ from 'lodash';

import BaseRule from './BaseRule';
import * as i18n from '../../../../utils/i18n';


const compoundHeterozygousModelRuleName = 'CompoundHeterozygousModel';
const gtGtField = 'GT_GT';

export default class CompoundHeterozygousModelRule extends BaseRule {
    constructor(props) {
        super(props);
    }

    isRuleAvailable() {
        const {historyItem: {modelId}, modelsList} = this.props;
        const model = modelsList.hashedArray.hash[modelId] || null;
        if (!model) {
            return false;
        }
        return model.rules.name ? model.rules.name === compoundHeterozygousModelRuleName : false;
    }

    isValid() {
        const {historyItem: {samples}, fields, samplesList, languageId, p} = this.props;
        const analysesSamples = _.map(samples, sample => samplesList.hashedArray.hash[sample.id]);
        const invalidGenotypeSample = _.find(analysesSamples, sample => _.isNull(sample.genotypeName));
        if (invalidGenotypeSample) {
            return {
                isValid: false,
                errorMessage: p.t('filterAndModel.errors.compHeterModelNoGenotypes', {name: i18n.getEntityText(invalidGenotypeSample, languageId).name})
            };
        }
        const invalidGtFieldSample = _.find(analysesSamples, sample => {
            const sampleFields = _.map(sample.sampleFields, value => fields.totalFieldsHashedArray.hash[value.fieldId]);
            return !_.some(sampleFields, sampleField => {
                return sampleField.name === gtGtField;
            });
        });
        if (invalidGtFieldSample) {
            return {
                isValid: false,
                errorMessage: p.t('filterAndModel.errors.compHeterModelNoField', {name: i18n.getEntityText(invalidGtFieldSample, languageId).name, field: gtGtField})
            };
        }
        return {
            isValid: true,
            errorMessage: null
        };
    }
}
