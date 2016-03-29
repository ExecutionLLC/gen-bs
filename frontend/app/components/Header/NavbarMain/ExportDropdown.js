import React, {Component} from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';

import ExportUtils from '../../../utils/exportUtils';

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

        const {selectedSearchKeysToVariants, currentView} = this.props;
        if (_.isEmpty(selectedSearchKeysToVariants)) {
            console.error('No rows selected for export.');
            return;
        }
        if (!currentView) {
            console.error('No current view is specified.');
            return;
        }

        // TODO: get fields and map field id to field name.
        const columns = _.map(currentView.view_list_items, listItem => {
            return {
                id: listItem.field_id,
                name: 'Column' + listItem.field_id
            }
        });

        // The export data should be array of objects in {field_id -> field_value} format.
        const dataToExport = _(selectedSearchKeysToVariants)
            .sortBy(item => item.rowIndex)
            .map(item => item.row.fieldsHash)
            .value();

        const exporter = ExportUtils.createExporter(selectedKey);
        if (!exporter) {
            console.error('No exporter of type "' + selectedKey + '" is found');
            return;
        }

        const blob = exporter.build(columns, dataToExport);
        
        // TODO: Use current sample name here.
        ExportUtils.downloadBlob(blob, `Genom-${new Date()}.${selectedKey}`);
    }
}

ExportDropdown.propTypes = {
    selectedSearchKeysToVariants: React.PropTypes.object.isRequired,
    currentView: React.PropTypes.object.isRequired
};
