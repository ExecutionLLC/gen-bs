import React from 'react';
import {Nav, NavDropdown, MenuItem} from 'react-bootstrap';

import {exportToFile} from '../../../actions/savedFiles';
import ComponentBase from '../../shared/ComponentBase';

export default class ExportDropdown extends ComponentBase {

    haveSelectedVariants() {
        const {selectedRowIndices} = this.props;
        return !_.isEmpty(selectedRowIndices);
    }

    renderExportItem(formatId) {
        const {p} = this.props;
        const formatLabel = p.t(`navBar.exports.formats.${formatId}`);
        return <MenuItem eventKey={formatId}>{formatLabel}</MenuItem>;
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
                        {this.renderExportItem('csv')}
                        {this.renderExportItem('sql')}
                        {this.renderExportItem('txt')}
                    </NavDropdown>
                </Nav>
            </div>
        );
    }

    renderExportButtonTitle() {
        const {p, selectedRowIndices} = this.props;
        const selectedVariantsCount = this.haveSelectedVariants() ? selectedRowIndices.length : 0;
        return (
            <span>
                <span className='hidden-xs'>
                    {p.t('navBar.exports.popupHeader')}
                </span>
                <span className='visible-xs'>
                    <span className='dropdown-menu-header'>
                        {p.t('navBar.exports.popupCaption')}
                    </span>
                    <i className='md-i md-cloud_download md-replace-to-close' />
                </span>
                { selectedVariantsCount ?
                    <span className='badge badge-warning'>{selectedVariantsCount}</span> :
                    null
                }
            </span>
        );
    }

    onExportItemSelected(selectedKey) {
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
