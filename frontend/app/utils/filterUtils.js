import FieldUtils from './fieldUtils';
import immutableArray from './immutableArray';

export const filterUtils = {
    settings: {
        default_condition: 'AND',

        genomicsOperators: {
            equal: function (v) {
                return {operator: '$eq', value: v[0]};
            },
            not_equal: function (v) {
                return {operator: '$neq', value: v[0]};
            },
            in: function (v) {
                return {operator: '$in', value: v};
            },
            not_in: function (v) {
                return {operator: '$nin', value: v};
            },
            less: function (v) {
                return {operator: '$lt', value: v[0]};
            },
            less_or_equal: function (v) {
                return {operator: '$lte', value: v[0]};
            },
            greater: function (v) {
                return {operator: '$gt', value: v[0]};
            },
            greater_or_equal: function (v) {
                return {operator: '$gte', value: v[0]};
            },
            between: function (v) {
                return {operator: '$between', value: v};
            },
            not_between: function (v) {
                return {operator: '$nbetween', value: v};
            },
            begins_with: function (v) {
                return {operator: '$begin_with', value: v[0]};
            },
            not_begins_with: function (v) {
                return {operator: '$nbegin_with', value: v[0]};
            },
            contains: function (v) {
                return {operator: '$contains', value: v[0]};
            },
            not_contains: function (v) {
                return {operator: '$ncontains', value: v[0]};
            },
            ends_with: function (v) {
                return {operator: '$end_with', value: v[0]};
            },
            not_ends_with: function (v) {
                return {operator: '$nend_with', value: v[0]};
            },
            is_null: function () {
                return {operator: '$eq', value: null};
            },
            is_not_null: function () {
                return {operator: '$neq', value: null};
            }
        },

        genomicsRuleOperators: {
            $eq: function (v) {
                return {
                    'val': v,
                    'op': v === null ? 'is_null' : 'equal'
                };
            },
            $neq: function (v) {
                return {
                    'val': v,
                    'op': v === null ? 'is_not_null' : 'not_equal'
                };
            },
            $in: function (v) {
                return {'val': v, 'op': 'in'};
            },
            $nin: function (v) {
                return {'val': v, 'op': 'not_in'};
            },
            $lt: function (v) {
                return {'val': v, 'op': 'less'};
            },
            $lte: function (v) {
                return {'val': v, 'op': 'less_or_equal'};
            },
            $gt: function (v) {
                return {'val': v, 'op': 'greater'};
            },
            $gte: function (v) {
                return {'val': v, 'op': 'greater_or_equal'};
            },
            $begin_with: function (v) {
                return {'val': v, 'op': 'begins_with'};
            },
            $nbegin_with: function (v) {
                return {'val': v, 'op': 'not_begins_with'};
            },
            $contains: function (v) {
                return {'val': v, 'op': 'contains'};
            },
            $ncontains: function (v) {
                return {'val': v, 'op': 'not_contains'};
            },
            $between: function (v) {
                return {'val': v, 'op': 'between'};
            },
            $nbetween: function (v) {
                return {'val': v, 'op': 'not_between'};
            },
            $end_with: function (v) {
                return {'val': v, 'op': 'ends_with'};
            },
            $nend_with: function (v) {
                return {'val': v, 'op': 'not_ends_with'};
            }
        }
    },
    Utils: {
        /**
         * Replaces {0}, {1}, ... in a string
         * @param str {string}
         * @return {string}
         */
        fmt: function (str/*, args*/) {
            var args = Array.prototype.slice.call(arguments, 1);

            return str.replace(/{([0-9]+)}/g, function (m, i) {
                return args[parseInt(i)];
            });
        },
        /**
         * Throw an Error object with custom name
         * @param type {string}
         */
        error: function (type/*, message, args*/) {
            var err = new Error(this.fmt.apply(null, Array.prototype.slice.call(arguments, 1)));
            err.name = type + 'Error';
            err.args = Array.prototype.slice.call(arguments, 2);
            throw err;
        },
        /**
         * Change type of a value to int or float
         * @param value {string|number|boolean}
         * @param type {string} 'integer', 'double' or anything else
         * @param boolAsInt {boolean} return 0 or 1 for booleans
         * @return {number}
         */
        changeType: function (value, type, boolAsInt) {
            switch (type) {
                case 'integer':
                    return parseInt(value);
                case 'double':
                    return parseFloat(value);
                case 'boolean':
                    var bool = value.trim().toLowerCase() === 'true' || value.trim() === '1' || value === 1;
                    return boolAsInt ? (bool ? 1 : 0) : bool;
                default:
                    return value;
            }
        }
    },
    operators: [
        {type: 'equal', nbInputs: 1, multiple: false, applyTo: ['string', 'number', 'datetime', 'boolean']},
        {type: 'not_equal', nbInputs: 1, multiple: false, applyTo: ['string', 'number', 'datetime', 'boolean']},
        {type: 'in', nbInputs: 1, multiple: true, applyTo: ['string', 'number', 'datetime']},
        {type: 'not_in', nbInputs: 1, multiple: true, applyTo: ['string', 'number', 'datetime']},
        {type: 'less', nbInputs: 1, multiple: false, applyTo: ['number', 'datetime']},
        {type: 'less_or_equal', nbInputs: 1, multiple: false, applyTo: ['number', 'datetime']},
        {type: 'greater', nbInputs: 1, multiple: false, applyTo: ['number', 'datetime']},
        {type: 'greater_or_equal', nbInputs: 1, multiple: false, applyTo: ['number', 'datetime']},
        {type: 'between', nbInputs: 2, multiple: false, applyTo: ['number', 'datetime']},
        {type: 'not_between', nbInputs: 2, multiple: false, applyTo: ['number', 'datetime']},
        {type: 'begins_with', nbInputs: 1, multiple: false, applyTo: ['string']},
        {type: 'not_begins_with', nbInputs: 1, multiple: false, applyTo: ['string']},
        {type: 'contains', nbInputs: 1, multiple: false, applyTo: ['string']},
        {type: 'not_contains', nbInputs: 1, multiple: false, applyTo: ['string']},
        {type: 'ends_with', nbInputs: 1, multiple: false, applyTo: ['string']},
        {type: 'not_ends_with', nbInputs: 1, multiple: false, applyTo: ['string']},
        {type: 'is_null', nbInputs: 0, multiple: false, applyTo: ['string', 'number', 'datetime', 'boolean']},
        {type: 'is_not_null', nbInputs: 0, multiple: false, applyTo: ['string', 'number', 'datetime', 'boolean']}
    ],

    /**
     * Return a particular operator by its type
     * @throws UndefinedOperatorError
     * @param type {string}
     * @return {object|null}
     */
    getOperatorByType: function (type) {
        if (type == '-1') {
            return null;
        }

        for (var i = 0, l = this.operators.length; i < l; i++) {
            if (this.operators[i].type == type) {
                return this.operators[i];
            }
        }

        this.Utils.error('UndefinedOperator', 'Undefined operator "{0}"', type);
    },

    /**
     * @typedef {{field: string, sampleType: string=, operator: string, value: *}} genomicsParsedDataRule
     * @typedef {{condition: string, rules: Array.<genomicsParsedDataGroup|genomicsParsedDataRule>}} genomicsParsedDataGroup
     * @typedef {genomicsParsedDataGroup} genomicsParsedData
     */

    genomicsParsedRulesModification: {
        group: {
            /**
             * @param {genomicsParsedDataGroup} group
             * @param {boolean} isAnd
             * @returns {genomicsParsedDataGroup}
             */
            setGroupCondition(group, isAnd) {
                return {
                    condition: isAnd ? 'AND' : 'OR',
                    rules: group.rules
                };
            },
            /**
             * @private
             * @param {genomicsParsedDataGroup} group
             * @param {Array.<genomicsParsedDataGroup|genomicsParsedDataRule>} newRules
             * @returns {genomicsParsedDataGroup}
             */
            _setGroupRules(group, newRules) {
                return {
                    condition: group.condition,
                    rules: newRules
                };
            },
            /**
             * @param {genomicsParsedDataGroup} group
             * @param {number} index
             * @param {genomicsParsedDataGroup|genomicsParsedDataRule} ruleOrGroup
             * @returns {genomicsParsedDataGroup}
             */
            replaceRule(group, index, ruleOrGroup) {
                return this._setGroupRules(group, immutableArray.replace(group.rules, index, ruleOrGroup));
            },
            /**
             * @param {genomicsParsedDataGroup} group
             * @param {number} index
             * @returns {genomicsParsedDataGroup}
             */
            removeRule(group, index) {
                if (group.rules.length > 1) {
                    return this._setGroupRules(group, immutableArray.remove(group.rules, index));
                } else {
                    return group;
                }
            },
            /**
             * @param {genomicsParsedDataGroup} group
             * @param {genomicsParsedDataGroup|genomicsParsedDataRule} ruleOrGroup
             * @returns {genomicsParsedDataGroup}
             */
            addRule(group, ruleOrGroup) {
                return this._setGroupRules(group, immutableArray.append(group.rules, ruleOrGroup));
            }
        },
        /**
         * @param {genomicsParsedData|genomicsParsedDataGroup} data
         * @param {number[]} indexPath
         * @param {function(genomicsParsedDataGroup):(genomicsParsedDataGroup)} doModifyFunction
         * @returns {genomicsParsedData|genomicsParsedDataGroup}
         */
        modifyGroup(data, indexPath, doModifyFunction) {
            if (!indexPath.length) {
                return doModifyFunction(data);
            }
            /** @type {number} */
            const indexInGroup = indexPath[0];
            /** @type {Array.<number>} */
            const indexPathNext = indexPath.slice(1, indexPath.length);
            /** @type {genomicsParsedDataGroup} */
            const changingGroup = data.rules[indexInGroup];
            /** @type {genomicsParsedDataGroup} */
            const newGroup = this.modifyGroup(changingGroup, indexPathNext, doModifyFunction);
            return this.group.replaceRule(data, indexInGroup, newGroup);
        },
        /**
         * @param {genomicsParsedData|genomicsParsedDataGroup} data
         * @param {number[]} indexPath
         * @param {boolean} isAnd
         * @returns {genomicsParsedData|genomicsParsedDataGroup}
         */
        switchCondition(data, indexPath, isAnd) {
            return this.modifyGroup(
                data,
                indexPath,
                (group) => this.group.setGroupCondition(group, isAnd)
            );
        },
        /**
         * @param {genomicsParsedData|genomicsParsedDataGroup} data
         * @param {number[]} indexPath
         * @param {genomicsParsedData|genomicsParsedDataGroup} ruleOrGroup
         * @returns {genomicsParsedData|genomicsParsedDataGroup}
         */
        appendRuleOrGroup(data, indexPath, ruleOrGroup) {
            return this.modifyGroup(
                data,
                indexPath,
                (group) => this.group.addRule(group, ruleOrGroup)
            );
        },
        /**
         * @param {genomicsParsedData|genomicsParsedDataGroup} data
         * @param {number[]} indexPath
         * @param {number} itemIndex
         * @returns {genomicsParsedData|genomicsParsedDataGroup}
         */
        removeRuleOrGroup(data, indexPath, itemIndex) {
            return this.modifyGroup(
                data,
                indexPath,
                (group) => this.group.removeRule(group, itemIndex)
            );
        },
        /**
         * @param {string} defaultFieldId
         * @param {string=} defaultSampleType
         * @returns {{id: string, field: string, sampleType: string=, operator: string, value: *}}
         */
        makeDefaultRule(defaultFieldId, defaultSampleType) {
            return {
                id: defaultFieldId,
                field: defaultFieldId,
                sampleType: defaultSampleType,
                operator: 'is_null',
                value: null
            };
        },
        /**
         * @param {string} defaultFieldId
         * @param {string=} defaultSampleType
         * @returns {genomicsParsedDataGroup}
         */
        makeDefaultGroup(defaultFieldId, defaultSampleType) {
            return {
                condition: filterUtils.settings.default_condition,
                rules: [
                    this.makeDefaultRule(defaultFieldId, defaultSampleType)
                ]
            };
        },
        /**
         * @param {genomicsParsedData|genomicsParsedDataGroup} data
         * @param {number[]} indexPath
         * @param {boolean} isGroup
         * @param {string} defaultFieldId
         * @param {string=} defaultSampleType
         */
        appendDefault(data, indexPath, isGroup, defaultFieldId, defaultSampleType) {
            const itemToAppend = isGroup ?
                this.makeDefaultGroup(defaultFieldId, defaultSampleType) :
                this.makeDefaultRule(defaultFieldId, defaultSampleType);
            return this.appendRuleOrGroup(data, indexPath, itemToAppend);
        },
        /**
         * @param {genomicsParsedData|genomicsParsedDataGroup} data
         * @param {number[]} indexPath
         * @param {number} itemIndex
         * @param {genomicsParsedDataRule} rule
         */
        setRule(data, indexPath, itemIndex, rule) {
            if (!indexPath.length) {
                return this.group.replaceRule(data, itemIndex, rule);
            }
            /** @type {number} */
            const indexInGroup = indexPath[0];
            /** @type {Array.<number>} */
            const indexPathNext = indexPath.slice(1, indexPath.length);
            /** @type {genomicsParsedDataGroup} */
            const changingGroup = data.rules[indexInGroup];
            /** @type {genomicsParsedDataGroup} */
            const newGroup = this.setRule(changingGroup, indexPathNext, itemIndex, rule);
            return this.group.replaceRule(data, indexInGroup, newGroup);
        }
    },

    /**
     * Get rules as Genomics query
     * @throws UndefinedGenomicsConditionError, UndefinedGenomicsOperatorError
     * @param {genomicsParsedData} data rules
     * @return {object}
     */
    getGenomics: function (data) {

        if (!data) {
            return null;
        }

        var self = this;

        return (function parse(data) {
            if (!data.condition) {
                data.condition = self.settings.default_condition;
            }
            if (['AND', 'OR'].indexOf(data.condition.toUpperCase()) === -1) {
                self.Utils.error('UndefinedGenomicsCondition', 'Unable to build Genomics query with condition "{0}"', data.condition);
            }

            if (!data.rules) {
                return {};
            }

            var parts = [];

            data.rules.forEach(function (rule) {
                if (rule.rules && rule.rules.length > 0) {
                    parts.push(parse(rule));
                }
                else {
                    var genomicsOp = self.settings.genomicsOperators[rule.operator];
                    var builderOp = self.getOperatorByType(rule.operator);
                    var values = [];

                    if (genomicsOp === undefined) {
                        self.Utils.error('UndefinedGenomicsOperator', 'Unknown Genomics operation for operator "{0}"', rule.operator);
                    }

                    if (builderOp.nbInputs !== 0) {
                        if (!(rule.value instanceof Array)) {
                            values.push(self.Utils.changeType(rule.value, rule.type, false));
                        } else {
                            rule.value.forEach(function (v) {
                                values.push(self.Utils.changeType(v, rule.type, false));
                            });
                        }
                    }

                    var part = {
                        ...genomicsOp.call(self, values),
                        field: rule.field,
                        sampleType: rule.sampleType
                    };
                    parts.push(part);
                }
            });

            var res = {
                condition: '$' + data.condition.toLocaleLowerCase(),
                rules: parts
            };
            return res;
        }(data));
    },

    /**
     * Convert Genomics object to rules
     * @throws GenomicsParseError, UndefinedGenomicsConditionError, UndefinedGenomicsOperatorError
     * @param {?{condition: string, rules: {condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]}} data query object
     * @return {?{condition: string, rules: {condition: *=, field: string=, id: string=, sampleType: string=, operator: string=, value: *=}[]}}
     */
    getRulesFromGenomics: function (data) {
        if (data == null) {
            return null;
        }

        var self = this;
        var conditions = {
            '$and': 'AND',
            '$or': 'OR'
        };

        return (function parse(data) {
            if (!data.condition || !data.rules) {
                self.Utils.error('GenomicsParse', 'Invalid Genomics query format');
            }
            if (!conditions[data.condition.toLowerCase()]) {
                self.Utils.error('UndefinedGenomicsCondition', 'Unable to build Genomics query with condition "{0}"', data.condition);
            }

            var rules = data.rules;
            var parts = [];

            rules.forEach(function (rule) {
                if (rule.condition) {
                    parts.push(parse(rule));
                } else {
                    var field = rule.field;
                    var sampleType = rule.sampleType;
                    var value = rule.value;
                    var operator = rule.operator;
                    var genomicsRule = self.settings.genomicsRuleOperators[operator];
                    if (genomicsRule === undefined) {
                        self.Utils.error('UndefinedGenomicsOperator', 'JSON Rule operation unknown for operator "{0}"', operator);
                    }

                    var opVal = genomicsRule.call(self, value);
                    parts.push({
                        id: field,
                        field: field,
                        sampleType: sampleType,
                        operator: opVal.op,
                        value: opVal.val
                    });
                }
            });

            var res = {};
            if (parts.length > 0) {
                res.condition = conditions[data.condition.toLowerCase()];
                res.rules = parts;
            }
            return res;
        }(data));
    }
};

export const opsUtils = {
    /**
     * Return operator wanted params count
     * Object contains one of properties:
     *   noParams - operator does not want any params
     *   single - operator want single parameter
     *   arrayDynamic - operator wants dynamic-size array
     *   arraySize - operator wants fixed-size array of arraySize length
     * @param {{type: string, nbInputs: number, multiple: boolean, applyTo: string[]}} operatorInfo as in filterUtils.operators
     * @returns {{noParams: boolean=, single: boolean=, arrayDynamic: boolean=, arraySize: number=}}
     */
    getOperatorWantedParams: function (operatorInfo) {
        if (!operatorInfo.nbInputs) {
            return {noParams: true};
        }
        if (operatorInfo.nbInputs <= 1 && !operatorInfo.multiple) {
            return {single: true};
        }
        if (operatorInfo.multiple) {
            return {arrayDynamic: true};
        } else {
            return {arraySize: operatorInfo.nbInputs};
        }
    }
};

export const genomicsParsedRulesValidate = {
    /**
     * Return true if operator allows given argument type
     * @param {{type: string, nbInputs: number, multiple: boolean, applyTo: string[]}} operator as in filterUtils.operators
     * @param {string} type
     * @returns {boolean}
     */
    isAllowedOperatorType(operator, type) {
        return operator.applyTo.indexOf(type) >= 0;
    },
    /**
     * Type cast value (single value, not an object or array) to desired type
     * @param {*} val
     * @param {string} type
     * @returns {*|null}
     */
    jsTypeCastValue(val, type) {
        const cast = {
            'string': (val) => typeof val === 'object' ? '' : '' + val,
            'number': (val) => +val || 0,
            'boolean': (val) => val === 'false' ? false : !!val
        }[type];
        return cast ? cast(val) : null;
    },
    /**
     * Type cast single value or array to desired typed array
     * 'len' is optional parameter. If it set then make result array exactly that length
     * either by cutting or enlarging it
     * @param {*|*[]} val
     * @param {string} type
     * @param {number=} len
     * @returns {*}
     */
    jsTypeCastArray(val, type, len) {
        if (!val || typeof val !== 'object' || !val.length) {
            return new Array(len || 1).fill(this.jsTypeCastValue(val, type));
        } else {
            return val
                .slice(0, len ? len : val.length)
                .map((v) => this.jsTypeCastValue(v, type))
                .concat(
                    new Array(len > val.length ? len - val.length : 0)
                        .fill(this.jsTypeCastValue(val[val.length - 1], type))
                );
        }
    },
    /**
     * Validate rule item (field, sampleType, operator, value), return valid rule,
     * rules group flag (groups are not validating here) or error message
     * Result value is type casted for field type
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {?{condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}} rule
     * @returns {{errorMessage: string=, isGroup: boolean=, validRule: {field: string, sampleType: string=, operator: string, value:*}=}}
     */
    validateRule(fields, rule) {
        if (!rule) {
            return {errorMessage: 'no rule'};
        }
        if (rule.condition) {
            return {isGroup: true};
        }
        if (!rule.field) {
            return ({errorMessage: 'no field'});
        }
        if (!rule.operator) {
            return ({errorMessage: 'no operator'});
        }

        const field = FieldUtils.getFieldById(fields, rule.field);
        if (!field) {
            return {errorMessage: 'field id "' + rule.field + '" is invalid'};
        }
        const fieldJSType = FieldUtils.getFieldJSType(field);
        const operatorType = rule.operator;
        const operatorInfo = filterUtils.getOperatorByType(operatorType);

        if (!this.isAllowedOperatorType(operatorInfo, fieldJSType)) {
            return {errorMessage: 'field "' + JSON.stringify(field) + '" of type "' + fieldJSType + '" not allowed for operator "' + operatorType + '"'};
        }

        const opWant = opsUtils.getOperatorWantedParams(operatorInfo);

        const value = rule.value;
        const castedValue = opWant.noParams ?
            null :
            opWant.single ?
                this.jsTypeCastValue(value, fieldJSType) :
                this.jsTypeCastArray(value, fieldJSType, opWant.arraySize || 0);

        return {
            validRule: {
                field: rule.field,
                sampleType: rule.sampleType,
                operator: rule.operator,
                value: castedValue
            }
        };
    },
    /**
     * Validate rules array
     * Return valid rules
     * Append validation report
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {{condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]} rules
     * @param {number[]} indexPath current rules group position, [] for root rules group, [1, 2] for 2nd group in 1st group in root
     * @returns {{validRules: {field: string, sampleType: string=, operator: string, value:*}[], report: {indexPath: number[], message: string}[]}}
     */
    validateRules(fields, rules, indexPath) {
        var report = [];
        const validRules = [];
        rules.map((rule, i) => {
            const validateRuleResult = this.validateRule(fields, rule);
            if (validateRuleResult.validRule) {
                validRules.push(validateRuleResult.validRule);
                return;
            }
            const ruleIndexPath = indexPath.concat([i]);
            if (validateRuleResult.isGroup) {
                const group = /** @type {{condition: string, rules: {condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]}} */rule;
                const validSubGroupResult = this.validateGroup(fields, group, ruleIndexPath);
                report = report.concat(validSubGroupResult.report);
                if (!validSubGroupResult.validGroup) {
                    report.push({indexPath: ruleIndexPath.slice(), message: 'invalid subgroup'});
                    return;
                }
                validRules.push(validSubGroupResult.validGroup);
                return;
            }
            report.push({indexPath: ruleIndexPath, message: validateRuleResult.errorMessage});
        });
        return {validRules, report};
    },
    /**
     * Validate rules group
     * Return valid group or null
     * Append validation report
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {{condition: string, rules: {condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]}} group
     * @param {number[]} indexPath
     * @returns {{validGroup: ?{condition: string, rules: {condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]}, report: {indexPath: number[], message: string}[]}}
     */
    validateGroup(fields, group, indexPath) {
        var reportGroup = [];
        if (group.condition !== 'AND' && group.condition !== 'OR') {
            reportGroup.push({
                indexPath: indexPath.slice(),
                message: 'bad group condition "' + group.condition + '" (must be AND|OR)'
            });
            return {validGroup: null, report: reportGroup};
        }
        if (!group.rules || typeof group.rules !== 'object' || !group.rules.length) {
            reportGroup.push({
                indexPath: indexPath.slice(),
                message: 'group content (type ' + typeof group.rules + ', !!rule=' + !!group.rules + (group.rules ? ', len = ' + group.rules.length : '') + ')'
            });
            return {validGroup: null, report: reportGroup};
        }
        const {validRules, report}= this.validateRules(fields, group.rules, indexPath);
        reportGroup = reportGroup.concat(report);
        if (!validRules.length) {
            reportGroup.push({indexPath: indexPath.slice(), message: 'empty group'});
            return {validGroup: null, report: reportGroup};
        }
        return {validGroup: {condition: group.condition, rules: validRules}, report: reportGroup};
    },
    /**
     * Validate parsed rules, return rules with valid items only (can be null) and validation report
     * Report is an array of object with message and index path (nested group indexes, [] is root) in source rules
     * @param {{id: string, label: string, type: string}[]} fields
     * @param {{condition: string, rules: {condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]}} rules
     * @returns {{validRules: ?{condition: string, rules: {condition: *=, field: string=, sampleType: string=, operator: string=, value: *=}[]}, report: {indexPath: number[], message: string}[]}}
     */
    validateGemonicsParsedRules(fields, rules) {
        const validateGroupResult = this.validateGroup(fields, rules, []);
        return {validRules: validateGroupResult.validGroup, report: validateGroupResult.report};

    }
};

const COMPLEX_MODEL_TYPE = 'complex';

export function isFilterComplexModel(filterOrModel) {
    return filterOrModel.modelType === COMPLEX_MODEL_TYPE;
}