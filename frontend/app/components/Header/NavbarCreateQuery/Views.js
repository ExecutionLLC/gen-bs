import React, {Component} from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';

import {changeView} from '../../../actions/ui'

export default class Views extends Component {


    render() {
        const dispatch = this.props.dispatch;
        const currentView = this.props.ui.currentView;
        return (

            <div className="table-cell max-width">
                <div className="btn-group btn-group-select100 view-select" data-localize="views.help"
                     data-toggle="tooltip" data-placement="bottom" data-container="body"
                     title="Select one or more from available views">

                    <Select
                        options={this.getViewOptions()}
                        value={currentView ? currentView.id: null}
                        clearable={false}
                        onChange={ (val) => dispatch(changeView(val.value) )}
                    />

                </div>
            </div>


        )
    }
    isViewDisabled(view){
        const {auth} = this.props
        return auth.isDemo && view.type == 'advanced';
    }

    getViewOptions() {
        const views = this.props.views;
        return views.map(
            v => {
                const isDisabled = this.isViewDisabled(v);
                return {
                    value: v.id, label: v.name, disabled: isDisabled
                }
            }
        )
    }
}
