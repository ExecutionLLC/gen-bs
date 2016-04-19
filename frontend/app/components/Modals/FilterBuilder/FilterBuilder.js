import React from 'react';

import filterOperators from './filterOperators'
import {
    filterBuilderReceiveRules,
    filterBuilderRequestRulesCancel
} from '../../../actions/filterBuilder';


export default class FilterBuilder extends React.Component {

    componentDidMount() {
        const {fields, filterBuilder:{editOrNew, editedFilter, newFilter}} = this.props;
        const filter = editOrNew ? (editedFilter) : (newFilter);
        var el = this.refs.builder;
        const notEditableSampleFields = _.filter(
            fields.totalFieldsList, (field) => field.sourceName == 'sample' && !field.isEditable
        );


        const builderFilters = [

            ...notEditableSampleFields.map((f) => {
                return {
                    id: f.id,
                    label: `${f.name} -- ${f.sourceName}`,
                    type: f.valueType === 'float' ? 'double' : f.valueType
                }
            }),
            ...fields.sourceFieldsList.filter((f) => (f.sourceName !== 'sample')).map((f) => {
                return {id: f.id, label: `${f.name} -- source`, type: f.valueType === 'float' ? 'double' : f.valueType}
            })

        ];

        window.$(el).queryBuilder({
            filters: builderFilters,
            operators: filterOperators
        });
        this.disableFilter(filter, el);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return this.props.fields !== nextProps.fields
            || this.props.filterBuilder !== nextProps.filterBuilder;
    }

    disableFilter(filter, el) {
        window.$(el).queryBuilder('setRulesFromGenomics', filter.rules);
        if (filter.type === 'standard' || filter.type == 'advanced') {
            //inputs and selects
            window.$('input[name*="builder-basic_rule"],select[name*="builder-basic_rule"]')
                .prop('disabled', true);
            //and, or operators
            window.$('div[class*="group-conditions"]')
                .children()
                .children()
                .prop('disabled', true);
            //add rule ,add group
            window.$('div[class*="group-actions"]')
                .children()
                .prop('disabled', true);
            window.$('div[class*="rule-actions"]')
                .children()
                .prop('disabled', true);
        }
    }

    componentWillUpdate(nextProps) {
        const {dispatch, fields} = nextProps;
        const {editOrNew, rulesRequested, editedFilter, newFilter} = nextProps.filterBuilder;
        const filter = editOrNew ? (editedFilter) : (newFilter);
        var el = this.refs.builder;
        var rules = [];
        const builderFilters = [

            ...fields.sampleFieldsList.map((f) => {
                return {
                    id: f.id,
                    label: `${f.label} -- ${f.sourceName}`,
                    type: f.valueType === 'float' ? 'double' : f.valueType
                }
            }),
            ...fields.sourceFieldsList.filter((f) => (f.sourceName !== 'sample')).map((f) => {
                return {id: f.id, label: `${f.label} -- source`, type: f.valueType === 'float' ? 'double' : f.valueType}
            })

        ];

        if (rulesRequested) {
            rules = window.$(el).queryBuilder('getGenomics');
            if (!filter.name.trim()) {
                dispatch(filterBuilderRequestRulesCancel());
            } else {
                dispatch(filterBuilderReceiveRules(rules))
            }
        } else {
            window.$(el).queryBuilder({
                filters: builderFilters,
                operators: filterOperators
            });
            this.disableFilter(filter, el);
        }
    }

    render() {

        return (
            <div className="builder-wrapper">
                <div id="builder-basic" className="query-builder form-inline" ref="builder"></div>
            </div>
        );
    }
}
