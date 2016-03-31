import React, {Component} from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';

import {exportToFile} from '../../../actions/savedFiles';

export default class ExportDropdown extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        const exportDropdownTitle = this.renderExportButtonTitle();
        return (
            <div>
                <Nav>
                    <NavDropdown title={exportDropdownTitle}
                                 id="export-dropdown"
                                 className="btn navbar-btn"
                                 onSelect={(e, item) => this.onExportItemSelected(e, item)}

                    >
                        <MenuItem eventKey="csv">CSV</MenuItem>
                        <MenuItem eventKey="sql">SQL</MenuItem>
                        <MenuItem eventKey="txt">Text</MenuItem>
                    </NavDropdown>
                </Nav>
            </div>
        );
    }

    renderExportButtonTitle() {
        const {selectedSearchKeysToVariants} = this.props;
        const selectedVariantsCount = Object.keys(selectedSearchKeysToVariants).length;

        if (!selectedVariantsCount) {
            return (<span>Export</span>);
        } else {
            return (<span>Export<span className="badge badge-warning">{selectedVariantsCount}</span></span>);
        }
    }

    onExportItemSelected(event, selectedKey) {
        event.preventDefault();

        const {
            dispatch,
            selectedSearchKeysToVariants
        } = this.props;

        if (_.isEmpty(selectedSearchKeysToVariants)) {
            console.log('Nothing is selected for export.');
            return;
        }

        dispatch(exportToFile(selectedKey));
    }
}

ExportDropdown.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    selectedSearchKeysToVariants: React.PropTypes.object.isRequired
};
