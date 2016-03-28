import React, {Component} from 'react';

export default class ExportDropdown extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>
                <div data-localize="files.export.help"
                     data-toggle="tooltip"
                     data-placement="right"
                     title="Select several mutations in the table and save to file. There are indicate the number of already selected recordings"
                     data-container="body"
                     data-trigger="hover">

                    <a className="btn navbar-btn" type="button" id="dropdownMenu1" data-toggle="modal"
                       data-target="#filename">
                        <span className="hidden-xxs" data-localize="files.export.title">Export</span>
                        <span className="visible-xxs"><i className="md-i">file_download</i></span>
                        <span className="badge badge-warning">7</span>
                    </a>
                </div>
            </div>
        );
    }
}
