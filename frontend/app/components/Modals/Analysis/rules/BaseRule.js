export default class BaseRule {

    constructor(props) {
        this.props = props;
    }

    isRuleAvailable() {
        throw new Error('Not implemented');
    }

    isValid() {
        throw new Error('Not implemented');
    }

    validate() {
        if (this.isRuleAvailable()) {
            return this.isValid();
        }
        return {
            isValid: true,
            errorMessage: null
        };
    }
}
