import React, {Component} from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';

import ExportUtils from '../../../utils/exportUtils';

export default class ExportDropdown extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>
                <Nav>
                    <NavDropdown title="Export"
                                 id="export-dropdown"
                                 onSelect={(e, item) => this.onExportItemSelected(e, item)}

                    >
                        <MenuItem eventKey="csv">CSV</MenuItem>
                        <MenuItem eventKey="sql">SQL</MenuItem>
                        <MenuItem eventKey="txt">Text</MenuItem>
                    </NavDropdown>
                </Nav>
                {
                    // <div data-localize="files.export.help"
                    //      data-toggle="tooltip"
                    //      data-placement="right"
                    //      title="Select several mutations in the table and save to file. There are indicate the number of already selected recordings"
                    //      data-container="body"
                    //      data-trigger="hover">
                    //
                    //     <a className="btn navbar-btn" type="button" id="dropdownMenu1" data-toggle="modal"
                    //        data-target="#filename">
                    //         <span className="hidden-xxs" data-localize="files.export.title">Export</span>
                    //         <span className="visible-xxs"><i className="md-i">file_download</i></span>
                    //         <span className="badge badge-warning">7</span>
                    //     </a>
                    // </div>
                }
            </div>
        );
    }

    onExportItemSelected(event, selectedKey) {
        event.preventDefault();

        const exporter = ExportUtils.createExporter(selectedKey);
        if (!exporter) {
            console.error('No exporter of type "' + ofType + '" is found');
            return;
        }
        const columns = [
            {
                id: 1,
                name: 'Column1'
            },
            {
                id: 2,
                name: 'Column2'
            }
        ];
        const data = [
            {
                '1': 'asd',
                '2': 'qwe'
            }, {
                '1': 'qwea',
                '2': 'aaaa'
            }
        ];

        const blob = exporter.build(columns, data);
        ExportUtils.downloadBlob(blob);
    }
}
