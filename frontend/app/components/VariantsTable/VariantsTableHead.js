import _ from 'lodash';
import React, {Component} from 'react';

import FieldHeader from './FieldHeader';

import {setFieldFilter, sortVariants, searchInResultsSortFilter} from '../../actions/variantsTable';

export default class VariantsTableHead extends Component {

    render() {
        const {dispatch, fields, ws, variantsHeader, variantsTable} = this.props;
        const {sort} = variantsTable.searchInResultsParams;
        const {isFetching} = variantsTable;
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
                {/*_.map(fieldIds, (fieldId) =>
                    _(variantsHeader)
                        .filter({fieldId})
                        .map((fieldSample) =>
                            this.renderFieldHeader(fieldId, fieldSample.sampleId, fields, expectedFieldsHash, isFetching, sort, dispatch))
                        .value()
                )*/
                _.map(variantsHeader, (fieldSample) =>
                    this.renderFieldHeader(fieldSample.fieldId, fieldSample.sampleId, fields, expectedFieldsHash, isFetching, sort, dispatch)
                )
                }
            </tr>
            </tbody>
        );
    }

    renderFieldHeader(fieldId, sampleId, fields, expectedFieldsHash, isFetching, sortState, dispatch) {
        const {totalFieldsHashedArray: {hash: totalFieldsHash}} = fields;
        const fieldMetadata = totalFieldsHash[fieldId];
        const areControlsEnabled = !!expectedFieldsHash[fieldId];
        const sendSortRequestedAction = (fieldId, direction, isControlKeyPressed) =>
            dispatch(sortVariants(fieldId, sampleId, direction, isControlKeyPressed));
        const sendSearchRequest = (fieldId, searchValue) => {
            dispatch(setFieldFilter(fieldId, sampleId, searchValue));
            dispatch(searchInResultsSortFilter());
        };
        const onSearchValueChanged = (fieldId, searchValue) => dispatch(setFieldFilter(fieldId, sampleId, searchValue));
        return (
            <FieldHeader key={fieldId + '-' + sampleId}
                         fieldMetadata={fieldMetadata}
                         sampleName={sampleId && this.props.samplesList.hashedArray.hash[sampleId].fileName || null}
                         sampleId={sampleId}
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
