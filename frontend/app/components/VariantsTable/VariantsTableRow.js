import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';

import ComponentBase from '../shared/ComponentBase';

import VariantsTableComment from './VariantsTableComment';

import FieldUtils from '../../utils/fieldUtils.js';

import {Popover, OverlayTrigger} from 'react-bootstrap';


export default class VariantsTableRow extends ComponentBase {
    render() {
        const {
            dispatch,
            row,
            auth,
            rowIndex,
            variantsHeader,
            sortState,
            isSelected
        } = this.props;
        const rowFields = row.fields;
        const mandatoryFields = row.mandatoryFields;
        const comments = row.comments;

        const pos = mandatoryFields['POS'];
        const alt = mandatoryFields['ALT'];
        const chrom = mandatoryFields['CHROM'];
        const ref = mandatoryFields['REF'];
        const searchKey = row.searchKey;

        return (
            <tr>
                <td className='btntd row_checkbox'>
                    <div>{rowIndex + 1}</div>
                </td>
                <td className='btntd row_checkbox'
                    key='row_checkbox'>
                    <div>
                        <label className='checkbox'>
                            <input type='checkbox'
                                   checked={isSelected}
                                   onChange={() => this.onRowSelectionChanged()}
                            />
                            <i/>
                        </label>
                        <span />
                    </div>
                </td>
                <td className='btntd'>
                    <div>
                    </div>
                </td>
                <VariantsTableComment alt={alt}
                                      pos={pos}
                                      reference={ref}
                                      chrom={chrom}
                                      searchKey={searchKey}
                                      dispatch={dispatch}
                                      auth={auth}
                                      comments={comments}
                />
                {_.map(rowFields, (value, index) =>
                    this.renderFieldValue(index, variantsHeader[index].fieldId, variantsHeader[index].sampleId, value, sortState)
                )}
            </tr>
        );
    }

    onRowSelectionChanged() {
        const {onSelected, rowIndex, isSelected} = this.props;
        onSelected(rowIndex, !isSelected);
    }

    renderFieldValue(index, fieldId, sampleId, value, sortState) {
        const {fields:{totalFieldsHashedArray:{hash}}} = this.props;
        const columnSortParams = _.find(sortState, {fieldId, sampleId});
        const sortedActiveClass = classNames({
            'active': columnSortParams
        });

        const field = hash[fieldId];
        const isChromosome = this.isChromosome(field);
        const isValuedHyperlink = this.isHyperlink(field, value);
        if (!value) {
            return this.renderEmptyFieldValue(sortedActiveClass, fieldId, sampleId);
        }

        const popover = (
            <Popover id={`${index}-${field.fieldId}`}>
                {isValuedHyperlink ? this.renderHyperLink(field.hyperlinkTemplate, value) :
                    isChromosome ? this.renderChromosome(value) : value}
            </Popover>
        );

        return (
            <td className={sortedActiveClass}
                key={fieldId + '-' + sampleId}>
                <div>
                    <OverlayTrigger
                        trigger='click'
                        ref='overlay'
                        rootClose={true}
                        placement='left'
                        overlay={popover}
                    >
                        <div>
                            <a className='btn-link-default editable editable-pre-wrapped editable-click editable-open'>
                                {isChromosome ? this.renderChromosome(value) : value}</a>
                        </div>
                    </OverlayTrigger>
                </div>
            </td>
        );
    }

    renderEmptyFieldValue(sortedActiveClass, fieldId, sampleId) {
        return (
            <td
                className={sortedActiveClass}
                key={`${fieldId}-${sampleId}`}
            >
                <div></div>
            </td>
        );
    }

    isChromosome(field) {
        return field.name === 'CHROM';
    }

    renderChromosome(value) {
        const chromosomeHash = {
            23: 'X',
            24: 'Y'
        };
        const chromosomeValue = chromosomeHash[value];
        return chromosomeValue ? `${chromosomeValue}(${value || ''})` : value || '';
    }

    renderHyperLink(hyperlinkTemplate, value){
        const replacementValue = encodeURIComponent(value);
        const valueUrl = hyperlinkTemplate.replace(FieldUtils.getDefaultLinkIdentity(), replacementValue);
        return (
            <a href={valueUrl}>{value}</a>
        );
    }

    isHyperlink(field, value) {
        return field.isHyperlink
            && field.hyperlinkTemplate
            && value
            && value !== '.';
    }

    shouldComponentUpdate(nextProps) {
        return this.props.row !== nextProps.row
            || this.props.isSelected !== nextProps.isSelected;
    }
}

VariantsTableRow.propTypes = {
    row: React.PropTypes.object.isRequired,
    rowIndex: React.PropTypes.number.isRequired,
    sortState: React.PropTypes.array.isRequired,
    auth: React.PropTypes.object.isRequired,
    dispatch: React.PropTypes.func.isRequired,
    isSelected: React.PropTypes.bool.isRequired,
    // callback(rowIndex, isSelected)
    onSelected: React.PropTypes.func.isRequired
};
