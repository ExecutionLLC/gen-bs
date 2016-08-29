import _ from 'lodash';
import React, {Component} from 'react';

import FieldHeader from './FieldHeader';

import {setFieldFilter, sortVariants, searchInResultsSortFilter} from '../../actions/variantsTable';

export default class VariantsTableHead extends Component {

    render() {
        const {dispatch, fields, ws} = this.props;
        const {sort} = this.props.variantsTable.searchInResultsParams;
        const {isFetching} = this.props.variantsTable;
        const {
            variantsView: currentView,
            variantsSampleFieldsList: currentSampleFields
        } = ws;

        if (!currentView) {
            return (
                <tbody className='table-variants-head' id='variants_table_head' ref='variantsTableHead'>
                <tr />
                </tbody>
            );
        }

        const fieldIds = _.map(currentView.viewListItems, item => item.fieldId);
        const expectedFields = [...fields.sourceFieldsList, ...currentSampleFields];
        const expectedFieldsHash = _.keyBy(expectedFields, (field) => field.id);

        const firstRowFields = this.props.variants[0].fields;

        return (
            <tbody className='table-variants-head' id='variants_table_head' ref='variantsTableHead'>
            <tr>
                <td className='btntd'>
                    <div></div>
                </td>
                <td className='btntd row_checkbox' key='row_checkbox'>
                    <div></div>
                </td>
                <td className='btntd'>
                    <div></div>
                </td>
                <td data-label='comment' key='comment' className='comment'>
                    <div>
                        <div className='variants-table-header-label'>
                            <a type='button' className='btn-link-default'>
                                Comment
                            </a>

                        </div>
                    </div>
                    <div className='variants-table-search-field input-group invisible'>
                       <span className='input-group-btn'>
                           <button className='btn btn-link-light-default'>
                               <i className='md-i'>search</i>
                           </button>
                       </span>
                        <input type='text' className='form-control material-input'
                               value=''
                        />
                    </div>
                </td>
                {_.map(fieldIds, (fieldId) => {
                    const fieldSample = _.find(firstRowFields, {fieldId});
                    if (!fieldSample) {
                        return null;
                    }
                    return this.renderFieldHeader(fieldSample.fieldId, fieldSample.sampleId, fields, expectedFieldsHash, isFetching, sort, dispatch);

                })}
            </tr>
            </tbody>
        );
    }

    renderFieldHeader(fieldId, sampleId, fields, expectedFieldsHash, isFetching, sortState, dispatch) {
        const {totalFieldsHashedArray: {hash: totalFieldsHash}} = fields;
        const fieldMetadata = totalFieldsHash[fieldId];
        const areControlsEnabled = !!expectedFieldsHash[fieldId];
        const sendSortRequestedAction = (fieldId, direction, isControlKeyPressed) =>
            dispatch(sortVariants(fieldId, direction, isControlKeyPressed));
        const sendSearchRequest = (fieldId, searchValue) => {
            dispatch(setFieldFilter(fieldId, searchValue));
            dispatch(searchInResultsSortFilter());
        };
        const onSearchValueChanged = (fieldId, searchValue) => dispatch(setFieldFilter(fieldId, searchValue));
        return (
            <FieldHeader key={fieldId + '-' + sampleId}
                         fieldMetadata={fieldMetadata}
                         sampleName={sampleId && this.props.samplesList.hashedArray.hash[sampleId].fileName || null}
                         areControlsEnabled={areControlsEnabled}
                         sortState={sortState}
                         onSortRequested={sendSortRequestedAction}
                         onSearchRequested={sendSearchRequest}
                         onSearchValueChanged={onSearchValueChanged}
                         currentVariants={this.props.ws.currentVariants}
                         disabled={isFetching}
            />
        );
    }

    componentDidMount() {
        const scrollElement = this.refs.variantsTableHead;
        scrollElement.addEventListener('scroll', this.handleScroll.bind(this));
    }

    componentWillUnmount() {
        const scrollElement = this.refs.variantsTableHead;
        scrollElement.removeEventListener('scroll', this.handleScroll);
    }

    handleScroll(e) {
        const el = e.target;
        if (this.props.xScrollListener) {
            this.props.xScrollListener(el.scrollLeft);
        }
    }

}
