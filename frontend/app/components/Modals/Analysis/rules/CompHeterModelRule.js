import _ from 'lodash';

import BaseRule from './BaseRule';
import {makeSampleLabelAsFileGenotype} from '../../../../utils/samplesUtils';

const compoundHeterozygousModelRuleName = 'Compound Heterozygous';
const gtGtField = 'GT_GT';

export default class CompoundHeterozygousModelRule extends BaseRule {
    constructor(props) {
        super(props);
    }

    isRuleAvailable() {
        const {historyItem:{modelId}, modelsList} = this.props;
        const model = modelsList.hashedArray.hash[modelId] || null;
        if (!model) {
            return false;
        }
        return model.rules.name ? model.name === compoundHeterozygousModelRuleName : false;
    }

    isValid() {
        const {historyItem:{samples}, fields, samplesList} = this.props;
        const analysesSamples = _.map(samples, sample => samplesList.hashedArray.hash[sample.id]);
        const invalidGenotypeSample = _.find(analysesSamples, sample => _.isNull(sample.genotypeName));
        if (invalidGenotypeSample) {
            return {
                isValid: false,
                errorMessage: `Sample '${invalidGenotypeSample.fileName}' doesn't have any genotype.` // TODO 757 remove fileName
            };
        }
        const invalidGtFieldSample = _.find(analysesSamples, sample => {
            const sampleFields = _.map(sample.sampleFields, value =>fields.totalFieldsHashedArray.hash[value.fieldId]);
            return !_.some(sampleFields, sampleField => {
                return sampleField.name === gtGtField;
            });
        });
        if (invalidGtFieldSample) {
            return {
                isValid: false,
                errorMessage: `Sample '${makeSampleLabelAsFileGenotype(invalidGtFieldSample)}' doesn't have ${gtGtField} field.`
            };
        }
        return {
            isValid: true,
            errorMessage: null
        };
    }
}
