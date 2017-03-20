import _ from 'lodash';
import React, {PropTypes, Component} from 'react';
import classNames from 'classnames';

import config from '../../../config';
import FieldUtils from '../../utils/fieldUtils';

export default class FieldHeaderControls extends Component {
    constructor(props) {
        super(props);

        this.state = {
            searchString: '',
            isFilterOpened: false
        };
    }

    render() {
        const {fieldMetadata, sortState, areControlsEnabled, disabled, sampleType, sampleId, sampleName, languageId} = this.props;
        const columnSortParams = sortState ? _.find(sortState, {fieldId: fieldMetadata.id, sampleId})
            : null;

        const isFilterOpened = this.state.isFilterOpened;
        const currentDirection = columnSortParams ? columnSortParams.direction : null;
        const order = columnSortParams ? columnSortParams.order : null;
        const ascSortBtnClasses = classNames(
            'btn-link',
            'btn-sort',
            'asc',
            {
                'active': currentDirection === 'asc'
            }
        );
        const descSortBtnClasses = classNames(
            'btn-link',
            'btn-sort',
            'desc',
            {
                'active': currentDirection === 'desc'
            }
        );
        const buttonGroupClasses = classNames(
            'btn-group',
            'btn-group-sort',
            {
                'open': isFilterOpened,
                'hidden': !areControlsEnabled
            }
        );

        const {label, title} = FieldUtils.makeFieldVariantsLabelTitle(fieldMetadata, sampleName, sampleType, languageId);

        return (
            <td>
                <div>
                    <div className='variants-table-header-label'>
                        <a type='button' className='btn-link-default' title={title}>
                            {label}
                        </a>
                        <div className={buttonGroupClasses}>
                            {this.renderSortButton('asc', currentDirection, ascSortBtnClasses, order, disabled)}
                            {this.renderSortButton('desc', currentDirection, descSortBtnClasses, order, disabled)}
                        </div>
                    </div>
                </div>
                {this.renderFilterInput()}
            </td>
        );
    }

    renderFilterInput() {
        const {fieldMetadata, areControlsEnabled, disabled} = this.props;
        const {searchString, isFilterOpened} = this.state;
        const fieldValueType = fieldMetadata.valueType;
        const isFieldSearchable = fieldValueType === 'string';
        const inputGroupClasses = classNames(
            'variants-table-search-field',
            'input-group',
            {
                'open': isFilterOpened,
                'invisible': !isFieldSearchable || !areControlsEnabled,
                'filtered': !!searchString
            }
        );

        if (isFieldSearchable && areControlsEnabled) {
            return (
                <div className={inputGroupClasses}>
                    <span className='input-group-btn'>
                        <button
                            className='btn btn-link-light-default'
                            onClick={() => this.setFilterOpened(true)}
                            disabled={disabled}
                        >
                            <i />
                        </button>
                    </span>
                    <input
                        type='text'
                        className='form-control material-input'
                        value={searchString}
                        ref={(input) => this.focusInput(input)}
                        onChange={(e) => this.onSearchInputChanged(e)}
                        onKeyPress={(e) => this.onSearchInputKeyPressed(e)}
                        onBlur={() => this.onSearchInputBlur()}
                        disabled={disabled}
                        maxLength={config.ANALYSIS.MAX_FILTER_LENGTH}
                    />
                </div>
            );
        } else {
            return (
                <div className={inputGroupClasses}>
                    <span className='input-group-btn'>
                        <button className='btn btn-link-light-default'>
                            <i />
                        </button>
                    </span>
                    <input
                        type='text'
                        className='form-control material-input'
                        value='Non-filtered type'
                        disabled='true'
                    />
                </div>
            );
        }
    }

    renderSortButton(direction, currentDirection, sortButtonClass, order, disabled) {
        return (
            <button
                className={sortButtonClass}
                key={direction}
                onClick={ e => this.onSortClick(direction, e.ctrlKey || e.metaKey) }
                disabled={disabled}
            >
                {direction === currentDirection &&
                <span className='text-info'>{order}</span>
                }
            </button>
        );
    }

    onSortClick(direction, isControlKeyPressed) {
        const {areControlsEnabled} = this.props;
        if (areControlsEnabled) {
            this.onSearchClick(direction, isControlKeyPressed);
        }
    }

    focusInput(input) {
        if (this.state.isFilterOpened && input !== null) {
            input.focus();
        }
    }

    onSearchInputBlur() {
        const {onSearchValueChanged} = this.props;
        onSearchValueChanged(this.state.searchString);
        this.setFilterOpened(false);
    }

    setFilterOpened(isOpened) {
        this.setState({
            isFilterOpened: isOpened
        });
    }

    onSearchInputChanged(e) {
        this.setState({
            searchString: e.target.value
        });
    }

    onSearchInputKeyPressed(e) {
        const {onSearchRequested} = this.props;
        if (e.charCode === 13) {
            onSearchRequested(this.state.searchString);
        }
    }

    onSearchClick(direction, isControlKeyPressed) {
        const {onSortRequested} = this.props;
        onSortRequested(direction, isControlKeyPressed);
    }
}

FieldHeaderControls.propTypes = {
    fieldMetadata: PropTypes.object.isRequired,
    areControlsEnabled: PropTypes.bool.isRequired,
    sortState: PropTypes.array.isRequired,
    // callback(fieldId, searchString)
    onSearchValueChanged: PropTypes.func.isRequired,
    // callback(fieldId, searchString)
    onSearchRequested: PropTypes.func.isRequired,
    /**
     * @type {function(direction: number, isControlKeyPressed: boolean)}, where direction in ['asc', 'desc']
     * */
    onSortRequested: PropTypes.func.isRequired
};
