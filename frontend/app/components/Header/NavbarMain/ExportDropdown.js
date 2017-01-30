import React from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';

import {exportToFile} from '../../../actions/savedFiles';
import ComponentBase from '../../shared/ComponentBase';

export default class ExportDropdown extends ComponentBase {

    haveSelectedVariants() {
        const {selectedRowIndices} = this.props;
        return !_.isEmpty(selectedRowIndices);
    }

    render() {
        const exportDropdownTitle = this.renderExportButtonTitle();
        return (
            <div>
                <Nav>
                    <NavDropdown title={exportDropdownTitle}
                                 id='export-dropdown'
                                 onSelect={(e, item) => this.onExportItemSelected(e, item)}
                                 disabled={!this.haveSelectedVariants()}
                    >
                        <MenuItem eventKey='csv'>CSV</MenuItem>
                        <MenuItem eventKey='sql'>SQL</MenuItem>
                        <MenuItem eventKey='txt'>Text</MenuItem>
                    </NavDropdown>
                </Nav>
            </div>
        );
    }

    renderExportButtonTitle() {
        if (!this.haveSelectedVariants()) {
            return (<span><span className='hidden-xs'>Export</span><span className='visible-xs'><span className='dropdown-menu-header'>Select export format</span><i className='md-i md-cloud_download md-replace-to-close'></i></span></span>);
        } else {
            const {selectedRowIndices} = this.props;
            const selectedVariantsCount = selectedRowIndices.length;
            return (<span><span className='hidden-xs'>Export</span><span className='visible-xs'><span className='dropdown-menu-header'>Select export format</span><i className='md-i md-cloud_download md-replace-to-close'></i></span><span className='badge badge-warning'>{selectedVariantsCount}</span></span>);
        }
    }

    onExportItemSelected(event, selectedKey) {
        event.preventDefault();

        const {
            dispatch,
            selectedRowIndices
        } = this.props;

        if (_.isEmpty(selectedRowIndices)) {
            console.log('Nothing is selected for export.');
            return;
        }

        dispatch(exportToFile(selectedKey));
    }
}

ExportDropdown.propTypes = {
    dispatch: React.PropTypes.func.isRequired,
    selectedRowIndices: React.PropTypes.array.isRequired
};
