import React, {PropTypes, Component} from 'react';
import classNames from 'classnames';

import  {firstCharToUpperCase} from '../../utils/stringUtils'

export default class FieldHeaderControls extends Component {
    constructor(props) {
        super(props);

        this.state = {
            searchString: '',
            isFilterOpened: false
        };
    }

    render() {
        const {fieldMetadata, sortState, areControlsEnabled} = this.props;
        const columnSortParams = sortState ? _.find(sortState, sortItem => sortItem.fieldId === fieldMetadata.id)
            : null;
        if (columnSortParams) {
            console.log('columnSortParams', columnSortParams)
        }

        const isFilterOpened = this.state.isFilterOpened;
        const currentDirection = columnSortParams ? columnSortParams.direction : null;
        const order = columnSortParams ? columnSortParams.order : null;
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
                'open': isFilterOpened,
                'hidden': !areControlsEnabled
            }
        );

        const name = firstCharToUpperCase(
            !fieldMetadata ? 'Unknown' : fieldMetadata.name
        );

        return (
            <td data-label={fieldMetadata.id}
                key={fieldMetadata.id}>
                <div>
                    <div className="variants-table-header-label">
                        <a type="button" className="btn-link-default">
                            {name}
                        </a>
                        <div className={buttonGroupClasses}>
                            {this.renderSortButton('asc', currentDirection, ascSortBtnClasses, order)}
                            {this.renderSortButton('desc', currentDirection, descSortBtnClasses, order)}
                        </div>
                    </div>
                </div>
                {this.renderFilterInput()}
            </td>
        );
    }

    renderFilterInput() {
        const {fieldMetadata, areControlsEnabled} = this.props;
        const {searchString, isFilterOpened} = this.state;
        const fieldValueType = fieldMetadata.valueType;
        const isFieldSearchable = fieldValueType === 'string';
        const inputGroupClasses = classNames(
            'variants-table-search-field',
            'input-group',
            {
                'open': isFilterOpened,
                'invisible': !isFieldSearchable || !areControlsEnabled
            }
        );

        if (isFieldSearchable && areControlsEnabled) {
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

    renderSortButton(direction, currentDirection, sortButtonClass, order) {
        return (
            <button className={sortButtonClass}
                    key={direction}
                    onClick={ e => this.onSortClick(direction, e.ctrlKey || e.metaKey) }>
                {direction === currentDirection &&
                <span className="text-info">{order}</span>
                }
            </button>
        );
    }

    onSortClick(direction, isControlKeyPressed) {
        const {areControlsEnabled} = this.props;
        if (areControlsEnabled) {
            this.onSearchClick(direction, isControlKeyPressed)
        }
    }

    focusInput(input) {
        if (this.state.isFilterOpened && input !== null) {
            input.focus();
        }
    }

    onSearchInputBlur() {
        const {fieldMetadata, onSearchValueChanged} = this.props;
        onSearchValueChanged(fieldMetadata.id, this.state.searchString);
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
        const {fieldMetadata, onSearchRequested} = this.props;
        if (e.charCode === 13) {
            onSearchRequested(fieldMetadata.id, this.state.searchString);
        }
    }

    onSearchClick(direction, isControlKeyPressed) {
        const {fieldMetadata, onSortRequested} = this.props;
        onSortRequested(fieldMetadata.id, direction, isControlKeyPressed);
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
     * @type {function(fieldId, direction, isControlKeyPressed)}, where direction in ['asc', 'desc']
     * */
    onSortRequested: PropTypes.func.isRequired
};
