import _ from 'lodash';
import React, {Component} from 'react';

import FieldHeaderControls from './FieldHeaderControls';

import {setFieldFilter, sortVariants, searchInResultsSortFilter} from '../../actions/variantsTable';
import * as i18n from '../../utils/i18n';
import FieldUtils from '../../utils/fieldUtils';


export default class VariantsTableHead extends Component {

    render() {
        const {dispatch, fields, variantsHeader, variantsTable, variantsAnalysis, variantsSamples, ui: {languageId}, p} = this.props;
        const {sort} = variantsTable.searchInResultsParams;
        const {isFetching} = variantsTable;

        if (!variantsAnalysis) {
            return (
                <tbody className='table-variants-head' id='variants_table_head' ref='variantsTableHead'>
                    <tr />
                </tbody>
            );
        }

        const typeLabels = FieldUtils.makeFieldTypeLabels(p);
        const samplesTypesHash = _(variantsAnalysis.samples).map((sampleInfo) =>
            variantsAnalysis.samples.length > 1 ?
                ({id: sampleInfo.id, type: typeLabels[sampleInfo.type]}) :
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
                <td key='comment' className='comment'>
                    <div>
                        <div className='variants-table-header-label'>
                            <a type='button' className='btn-link-default'>
                                {p.t('variantsTable.headComment')}
                            </a>
                        </div>
                    </div>
                    <div className='variants-table-search-field input-group invisible'>
                        <span className='input-group-btn'>
                            <button className='btn btn-link-light-default'>
                                <i className='md-i'>search</i>
                            </button>
                        </span>
                        <input
                            type='text'
                            className='form-control material-input'
                            value=''
                        />
                    </div>
                </td>
                {_.map(variantsHeader, (fieldSampleExist) =>
                    this.renderFieldHeaderControls(
                        fieldSampleExist.fieldId, fieldSampleExist.sampleId, fieldSampleExist.exist, fieldSampleExist.unique,
                        samplesTypesHash, variantsSamples, fields, isFetching, sort, languageId, dispatch
                    )
                )}
            </tr>
            </tbody>
        );
    }

    renderFieldHeaderControls(fieldId, sampleId, isExist, isUnique, samplesTypesHash, variantsSamples, fields, isFetching, sortState, languageId) {
        const {totalFieldsHashedArray: {hash: totalFieldsHash}} = fields;
        const fieldMetadata = {
            ...totalFieldsHash[fieldId],
            isUnique
        };
        const areControlsEnabled = !!isExist;
        const currentSample = _.keyBy(variantsSamples, sample => sample.id)[sampleId];
        const sampleName = currentSample ? i18n.getEntityText(currentSample, languageId).name : null;
        return (
            <FieldHeaderControls
                key={fieldId + (sampleId ? '-' + sampleId : '')}
                fieldMetadata={fieldMetadata}
                sampleName={sampleName}
                sampleType={sampleId ? samplesTypesHash[sampleId].type : ''}
                sampleId={sampleId}
                areControlsEnabled={areControlsEnabled}
                sortState={sortState}
                onSortRequested={(direction, isControlKeyPressed) => {
                    this.onSendSortRequestedAction(fieldId, sampleId, direction, isControlKeyPressed);
                }}
                onSearchRequested={(searchValue) => {
                    this.onSendSearchRequest(fieldId, sampleId, searchValue);
                }}
                currentVariants={this.props.ws.currentVariants}
                languageId={languageId}
                disabled={isFetching}
            />
        );
    }

    onSendSearchRequest(fieldId, sampleId, searchValue) {
        const {dispatch} = this.props;
        dispatch(setFieldFilter(fieldId, sampleId, searchValue));
        dispatch(searchInResultsSortFilter());
    }

    onSendSortRequestedAction(fieldId, sampleId, direction, isControlKeyPressed) {
        const {dispatch} = this.props;
        dispatch(sortVariants(fieldId, sampleId, direction, isControlKeyPressed));
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
