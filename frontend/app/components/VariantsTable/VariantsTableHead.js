import _ from 'lodash';
import React, {Component} from 'react';

import FieldHeader from './FieldHeader';

import {setFieldFilter, sortVariants, searchInResultsSortFilter} from '../../actions/variantsTable';
import * as SamplesUtils from '../../utils/samplesUtils';

export default class VariantsTableHead extends Component {

    render() {
        const {dispatch, fields, variantsHeader, variantsTable, variantsAnalysis, variantsSamples} = this.props;
        const {sort} = variantsTable.searchInResultsParams;
        const {isFetching} = variantsTable;

        if (!variantsAnalysis) {
            return (
                <tbody className='table-variants-head' id='variants_table_head' ref='variantsTableHead'>
                <tr />
                </tbody>
            );
        }

        const samplesTypesHash = _(variantsAnalysis.samples).map((sampleInfo) =>
            variantsAnalysis.samples.length > 1 ?
                ({id: sampleInfo.id, type: SamplesUtils.typeLabels[sampleInfo.type]}) :
                ({id: sampleInfo.id, type: ''})
        ).keyBy(sampleInfo => sampleInfo.id).value();
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
                {_.map(variantsHeader, (fieldSampleExist) =>
                    this.renderFieldHeader(
                        fieldSampleExist.fieldId, fieldSampleExist.sampleId, fieldSampleExist.exist, fieldSampleExist.unique,
                        samplesTypesHash, variantsSamples, fields, isFetching, sort, dispatch)
                )}
            </tr>
            </tbody>
        );
    }

    renderFieldHeader(fieldId, sampleId, isExist,isUnique, samplesTypesHash, variantsSamples, fields, isFetching, sortState, dispatch) {
        const {totalFieldsHashedArray: {hash: totalFieldsHash}} = fields;
        const fieldMetadata = {
            ...totalFieldsHash[fieldId],
            isUnique
        };
        const areControlsEnabled = !!isExist;
        const sendSortRequestedAction = (fieldId, direction, isControlKeyPressed) =>
            dispatch(sortVariants(fieldId, sampleId, direction, isControlKeyPressed));
        const sendSearchRequest = (fieldId, searchValue) => {
            dispatch(setFieldFilter(fieldId, sampleId, searchValue));
            dispatch(searchInResultsSortFilter());
        };
        const onSearchValueChanged = (fieldId, searchValue) => dispatch(setFieldFilter(fieldId, sampleId, searchValue));
        const currentSample = _.keyBy(variantsSamples, sample => sample.id)[sampleId];
        const sampleName = currentSample ?
            SamplesUtils.makeSampleLabel(currentSample) :
            null;
        return (
            <FieldHeader key={fieldId + (sampleId ? '-' + sampleId : '')}
                         fieldMetadata={fieldMetadata}
                         sampleName={sampleName}
                         sampleType={sampleId ? samplesTypesHash[sampleId].type : ''}
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
