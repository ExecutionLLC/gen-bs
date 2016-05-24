import React, {Component} from 'react';
import Select from '../../shared/Select';
import {viewsListSelectView} from '../../../actions/viewsList';
import 'react-select/dist/react-select.css';

import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {changeView} from '../../../actions/ui';

export default class Views extends Component {


    render() {
        const dispatch = this.props.dispatch;
        const {selectedViewId} = this.props.viewsList;
        return (

            <div className='table-cell max-width'>
                <div className='btn-group btn-group-select100 view-select' data-localize='views.help'
                     data-toggle='tooltip' data-placement='bottom' data-container='body'
                     title='Select one of available views'>

                    <Select
                        options={this.getViewOptions()}
                        value={selectedViewId}
                        onChange={ (val) => {
                            dispatch(changeView(val.value)); // TODO vl3 need?
                            dispatch(viewsListSelectView(val.value));
                        }}
                    />

                </div>
            </div>


        );
    }

    isViewDisabled(view) {
        const {auth} = this.props;
        return auth.isDemo && view.type == 'advanced';
    }

    getViewOptions() {
        const views = this.props.views;
        return views.map(
            (viewItem) => {
                const isDisabled = this.isViewDisabled(viewItem);
                const label = getItemLabelByNameAndType(viewItem.name, viewItem.type);
                return {
                    value: viewItem.id, label, disabled: isDisabled
                };
            }
        );
    }
}
