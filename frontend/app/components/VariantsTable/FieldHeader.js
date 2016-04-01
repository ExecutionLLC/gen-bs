import React, {Component} from 'react';
import classNames from 'classnames';

import  {firstCharToUpperCase} from '../../utils/stringUtils'
import FieldUtils from '../../utils/fieldUtils'

export default class FieldHeaderControls extends Component {
    constructor(props) {
        super(props);

        this.state = {
            searchString: '',
            isFilterOpened: false
        };
    }

    isFieldExists(fieldId) {
        const {currentVariants} = this.props;
        if (_.isEmpty(currentVariants)) {
            return false;
        } else {
            const variantField = _.find(currentVariants[0].fields, field=>field.field_id == fieldId);
            return (variantField) ? true : false;
        }
    }

    render() {
        const {fieldId, fields, sortState} = this.props;
        const columnSortParams = sortState ? _.find(sortState, sortItem => sortItem.field_id === fieldId)
            : null;
        if (columnSortParams) {
            console.log('columnSortParams', columnSortParams)
        }

        const isFilterOpened = this.state.isFilterOpened;
        const currentDirection = columnSortParams ? columnSortParams.direction : null;
        const order = columnSortParams ? columnSortParams.order : null;
        const isExists = this.isFieldExists(fieldId);
        const ascSortBtnClasses = classNames(
            'btn',
            'btn-sort', 'asc', {
                'active': currentDirection === 'asc'
            }
        );
        const descSortBtnClasses = classNames(
            'btn',
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
                'open': isFilterOpened
            }
        );

        const fieldMetadata = FieldUtils.find(fieldId, fields);

        const name = firstCharToUpperCase(
            !fieldMetadata ? 'Unknown' : fieldMetadata.name
        );

        return (
            <td data-label={fieldId}
                key={fieldId}>
                <div>
                    <div className="variants-table-header-label">
                        <a type="button" className="btn-link-default">
                            {name}
                        </a>
                        <div className={buttonGroupClasses} role="group" data-toggle="buttons">
                            {this.renderSortButton('asc', currentDirection, ascSortBtnClasses, order, isExists)}
                            {this.renderSortButton('desc', currentDirection, descSortBtnClasses, order, isExists)}
                        </div>
                    </div>
                </div>
                {this.renderFilterInput(isExists)}
            </td>
        );
    }

    renderFilterInput(isExists) {
        const {fieldId, fields} = this.props;
        const {searchString, isFilterOpened} = this.state;
        const fieldMetadata = FieldUtils.find(fieldId, fields);
        const fieldValueType = fieldMetadata ? fieldMetadata.value_type : null;
        const isFieldSearchable = fieldValueType === 'string';
        const inputGroupClasses = classNames(
            'variants-table-search-field',
            'input-group',
            {
                'open': isFilterOpened,
                'invisible': !isFieldSearchable
            }
        );

        if (isFieldSearchable && isExists) {
            return (
                <div className={inputGroupClasses}>
                    <span className="input-group-btn">
                        <button className="btn btn-link-light-default"
                                onClick={() => this.setFilterOpened(true)}>
                            <i></i>
                        </button>
                    </span>
                    <input type="text"
                           className="form-control material-input"
                           value={searchString}
                           ref={(input) => this.focusInput(input)}
                           onChange={(e) => this.onSearchInputChanged(e)}
                           onKeyPress={(e) => this.onSearchInputKeyPressed(e)}
                           onBlur={(e) => this.onSearchInputBlur()}
                    />
                </div>
            );
        } else {
            return (
                <div className={inputGroupClasses}>
                    <span className="input-group-btn">
                        <button className="btn btn-link-light-default">
                            <i></i>
                        </button>
                    </span>
                    <input type="text"
                           className="form-control material-input"
                           value="Non-filtered type"
                           disabled
                    />
                </div>
            );
        }
    }

    renderSortButton(direction, currentDirection, sortButtonClass, order, isExists) {
        return (
            <button className={sortButtonClass}
                    key={direction}
                    onClick={ e => this.onSortClick(isExists, direction, e.ctrlKey || e.metaKey) }>
                {direction === currentDirection &&
                <span className="text-info">{order}</span>
                }
            </button>
        );
    }

    onSortClick(isExists, direction, isControlKeyPressed) {
        if (isExists) {
            this.onSearchClick(direction, isControlKeyPressed)
        }
    }

    focusInput(input) {
        if (this.state.isFilterOpened && input !== null) {
            input.focus();
        }
    }

    onSearchInputBlur() {
        const {fieldId, onSearchValueChanged} = this.props;
        onSearchValueChanged(fieldId, this.state.searchString);
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
        const {fieldId, onSearchRequested} = this.props;
        if (e.charCode === 13) {
            onSearchRequested(fieldId, this.state.searchString);
        }
    }

    onSearchClick(direction, isControlKeyPressed) {
        const {fieldId, onSortRequested} = this.props;
        onSortRequested(fieldId, direction, isControlKeyPressed);
    }
}

FieldHeaderControls.propTypes = {
    fieldId: React.PropTypes.string.isRequired,
    fields: React.PropTypes.object.isRequired,
    sortState: React.PropTypes.array.isRequired,
    // callback(fieldId, searchString)
    onSearchValueChanged: React.PropTypes.func.isRequired,
    // callback(fieldId, searchString)
    onSearchRequested: React.PropTypes.func.isRequired,
    // callback(fieldId, direction, isControlKeyPressed), where direction in ['asc', 'desc']
    onSortRequested: React.PropTypes.func.isRequired
};
