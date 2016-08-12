import React from 'react';
import {connect} from 'react-redux';

import DialogBase from './DialogBase';
import {showProteinModal} from '../../actions/variantsTable';

class ProteinModal extends DialogBase {
    constructor(props) {
        super(props, 'protein-modal');
    }

    renderTitleContents() {
        return '3D Structure';
    }

    renderBodyContents() {
        const {currentProtein} = this.props;
        return (
            <div>Hello! Current protein is {currentProtein}.</div>
        );
    }

    renderFooter() {
        return null;
    }

    onCloseModal() {
        const {dispatch} = this.props;
        dispatch(showProteinModal(false));
    }

    static protTypes = {
        showModal: React.PropTypes.bool.isRequired,
        currentProtein: React.PropTypes.string.isRequired
    };
}

function mapStateToProps(state) {
    const {variantsTable: {currentProtein}} = state;

    return {
        currentProtein
    };
}

export default connect(mapStateToProps)(ProteinModal);