import React, {Component} from 'react';
import {viewBuilderStartEdit} from '../../../actions/viewBuilder';

export default class ViewsSetup extends Component {

    constructor(props) {
        super(props);
    }

    onViewsClick() {
        const {viewIdToViewHash} = this.props.viewsList;
        const {selectedViewId} = this.props.viewsList;
        const selectedView = viewIdToViewHash[selectedViewId];
        this.props.dispatch(viewBuilderStartEdit(false, selectedView));
        this.props.openModal('views');
    }

    render() {
        return (

            <div className='table-cell'>
                <div className='btn-group'
                     data-localize='views.setup.help'
                     data-toggle='tooltip'
                     data-placement='bottom'
                     data-container='body'
                     title='Select existing view or create a new one.'>
                    <button
                        className='btn btn-default' type='button' data-toggle='modal' data-target='#selectColumns'
                        onClick={() => this.onViewsClick()}
                    >
                        <span data-localize='views.title'>Views</span>
                    </button>
                </div>
            </div>
        );
    }
}
