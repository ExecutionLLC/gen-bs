const filterUtils = {
    settings: {
        default_condition: 'AND',

        genomicsOperators: {
            equal:            function(v) { return { '$eq': v[0] }; },
            not_equal:        function(v) { return { '$neq': v[0] }; },
            in:               function(v) { return { '$in': v }; },
            not_in:           function(v) { return { '$nin': v }; },
            less:             function(v) { return { '$lt': v[0] }; },
            less_or_equal:    function(v) { return { '$lte': v[0] }; },
            greater:          function(v) { return { '$gt': v[0] }; },
            greater_or_equal: function(v) { return { '$gte': v[0] }; },
            between:          function(v) { return { '$between': v }; },
            not_between:      function(v) { return { '$nbetween': v }; },
            begins_with:      function(v) { return { '$begin_with': v[0] }; },
            not_begins_with:  function(v) { return { '$nbegin_with': v[0] }; },
            contains:         function(v) { return { '$contains': v[0] }; },
            not_contains:     function(v) { return { '$ncontains': v[0] }; },
            ends_with:        function(v) { return { '$end_with': v[0] }; },
            not_ends_with:    function(v) { return { '$nend_with': v[0] }; },
            is_empty:         function(v) { return { '$eq': '' }; },
            is_not_empty:     function(v) { return { '$neq': '' }; },
            is_null:          function(v) { return { '$eq': null }; },
            is_not_null:      function(v) { return { '$neq': null }; }
        },

        genomicsRuleOperators: {
            $eq: function(v) {
                v = v.$eq;
                return {
                    'val': v,
                    'op': v === null ? 'is_null' : (v === '' ? 'is_empty' : 'equal')
                };
            },
            $neq: function(v) {
                v = v.$neq;
                return {
                    'val': v,
                    'op': v === null ? 'is_not_null' : (v === '' ? 'is_not_empty' : 'not_equal')
                };
            },
            $in: function(v) { return { 'val': v.$in, 'op': 'in' }; },
            $nin: function(v) { return { 'val': v.$nin, 'op': 'not_in' }; },
            $lt: function(v) { return { 'val': v.$lt, 'op': 'less' }; },
            $lte: function(v) { return { 'val': v.$lte, 'op': 'less_or_equal' }; },
            $gt: function(v) { return { 'val': v.$gt, 'op': 'greater' }; },
            $gte: function(v) { return { 'val': v.$gte, 'op': 'greater_or_equal' }; },
            $begin_with: function(v) { return { 'val': v.$begin_with, 'op': 'begins_with' }; },
            $nbegin_with: function(v) { return { 'val': v.$nbegin_with, 'op': 'not_begins_with' }; },
            $contains: function(v) { return { 'val': v.$contains, 'op': 'contains' }; },
            $ncontains: function(v) { return { 'val': v.$ncontains, 'op': 'not_contains' }; },
            $between: function(v) { return { 'val': v.$between, 'op': 'between' }; },
            $nbetween: function(v) { return { 'val': v.$nbetween, 'op': 'not_between' }; },
            $end_with: function(v) { return { 'val': v.$end_with, 'op': 'ends_with' }; },
            $nend_with: function(v) { return { 'val': v.$nend_with, 'op': 'not_ends_with' }; }
        }
    },
    Utils: {
        /**
         * Replaces {0}, {1}, ... in a string
         * @param str {string}
         * @param args,... {mixed}
         * @return {string}
         */
        fmt: function(str/*, args*/) {
            var args = Array.prototype.slice.call(arguments, 1);

            return str.replace(/{([0-9]+)}/g, function(m, i) {
                return args[parseInt(i)];
            });
        },
        /**
         * Throw an Error object with custom name
         * @param type {string}
         * @param message {string}
         * @param args,... {mixed}
         */
        error: function(type, message/*, args*/) {
            var err = new Error(this.fmt.apply(null, Array.prototype.slice.call(arguments, 1)));
            err.name = type + 'Error';
            err.args = Array.prototype.slice.call(arguments, 2);
            throw err;
        },
        /**
         * Change type of a value to int or float
         * @param value {mixed}
         * @param type {string} 'integer', 'double' or anything else
         * @param boolAsInt {boolean} return 0 or 1 for booleans
         * @return {mixed}
         */
        changeType: function(value, type, boolAsInt) {
            switch (type) {
                case 'integer': return parseInt(value);
                case 'double': return parseFloat(value);
                case 'boolean':
                    var bool = value.trim().toLowerCase() === 'true' || value.trim() === '1' || value === 1;
                    return boolAsInt ? (bool ? 1 : 0) : bool;
                default: return value;
            }
        }
    },
    operators: [
        { type: 'equal',            nb_inputs: 1, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'not_equal',        nb_inputs: 1, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'in',               nb_inputs: 1, multiple: true,  apply_to: ['string', 'number', 'datetime'] },
        { type: 'not_in',           nb_inputs: 1, multiple: true,  apply_to: ['string', 'number', 'datetime'] },
        { type: 'less',             nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
        { type: 'less_or_equal',    nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
        { type: 'greater',          nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
        { type: 'greater_or_equal', nb_inputs: 1, multiple: false, apply_to: ['number', 'datetime'] },
        { type: 'between',          nb_inputs: 2, multiple: false, apply_to: ['number', 'datetime'] },
        { type: 'not_between',      nb_inputs: 2, multiple: false, apply_to: ['number', 'datetime'] },
        { type: 'begins_with',      nb_inputs: 1, multiple: false, apply_to: ['string'] },
        { type: 'not_begins_with',  nb_inputs: 1, multiple: false, apply_to: ['string'] },
        { type: 'contains',         nb_inputs: 1, multiple: false, apply_to: ['string'] },
        { type: 'not_contains',     nb_inputs: 1, multiple: false, apply_to: ['string'] },
        { type: 'ends_with',        nb_inputs: 1, multiple: false, apply_to: ['string'] },
        { type: 'not_ends_with',    nb_inputs: 1, multiple: false, apply_to: ['string'] },
        { type: 'is_empty',         nb_inputs: 0, multiple: false, apply_to: ['string'] },
        { type: 'is_not_empty',     nb_inputs: 0, multiple: false, apply_to: ['string'] },
        { type: 'is_null',          nb_inputs: 0, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] },
        { type: 'is_not_null',      nb_inputs: 0, multiple: false, apply_to: ['string', 'number', 'datetime', 'boolean'] }
    ],

    /**
     * Return a particular operator by its type
     * @throws UndefinedOperatorError
     * @param type {string}
     * @return {object|null}
     */
    getOperatorByType: function(type) {
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
     * Get rules as Genomics query
     * @throws UndefinedGenomicsConditionError, UndefinedGenomicsOperatorError
     * @param data {object} (optional) rules
     * @return {object}
     */
    getGenomics: function(data) {
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

            data.rules.forEach(function(rule) {
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

                    if (builderOp.nb_inputs !== 0) {
                        if (!(rule.value instanceof Array)) {
                            rule.value = [rule.value];
                        }

                        rule.value.forEach(function(v) {
                            values.push(self.Utils.changeType(v, rule.type, false));
                        });
                    }

                    var part = {};
                    part[rule.field] = genomicsOp.call(self, values);
                    parts.push(part);
                }
            });

            var res = {};
            if (parts.length > 0) {
                res['$' + data.condition.toLowerCase()] = parts;
            }
            return res;
        }(data));
    },

    /**
     * Convert Genomics object to rules
     * @throws GenomicsParseError, UndefinedGenomicsConditionError, UndefinedGenomicsOperatorError
     * @param data {object} query object
     * @return {object}
     */
    getRulesFromGenomics: function(data) {
        if (data === undefined || data === null) {
            return null;
        }

        var self = this;
        var conditions = {
            '$and': 'AND',
            '$or': 'OR'
        };

        return (function parse(data) {
            var topKeys = Object.keys(data);

            if (topKeys.length > 1) {
                self.Utils.error('GenomicsParse', 'Invalid Genomics query format');
            }
            if (!conditions[topKeys[0].toLowerCase()]) {
                self.Utils.error('UndefinedGenomicsCondition', 'Unable to build Genomics query with condition "{0}"', topKeys[0]);
            }

            var rules = data[topKeys[0]];
            var parts = [];

            rules.forEach(function(rule) {
                var keys = Object.keys(rule);

                if (conditions[keys[0].toLowerCase()]) {
                    parts.push(parse(rule));
                }
                else {
                    var field = keys[0];
                    var value = rule[field];

                    var operator = self.determineGenomicsOperator(value, field);
                    if (operator === undefined) {
                        self.Utils.error('GenomicsParse', 'Invalid Genomics query format');
                    }

                    var genomicsRule = self.settings.genomicsRuleOperators[operator];
                    if (genomicsRule === undefined) {
                        self.Utils.error('UndefinedGenomicsOperator', 'JSON Rule operation unknown for operator "{0}"', operator);
                    }

                    var opVal = genomicsRule.call(self, value);
                    parts.push({
                        id: field,
                        field: field,
                        operator: opVal.op,
                        value: opVal.val
                    });
                }
            });

            var res = {};
            if (parts.length > 0) {
                res.condition = conditions[topKeys[0].toLowerCase()];
                res.rules = parts;
            }
            return res;
        }(data));
    },
    /**
     * Find which operator is used in a Genomics sub-object
     * @param {mixed} value
     * @param {string} field
     * @return {string|undefined}
     */
    determineGenomicsOperator: function(value, field) {
        if (value !== null && typeof value == 'object') {
            var subkeys = Object.keys(value);

            if (subkeys.length === 1) {
                return subkeys[0];
            }
        }
    }
};

export default filterUtils;