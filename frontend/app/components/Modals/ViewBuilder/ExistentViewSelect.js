import React, { Component } from 'react';
import { Modal } from 'react-bootstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';

import { viewBuilderSelectView, viewBuilderToggleNewEdit } from '../../../actions/viewBuilder'


export default class ExistentViewSelect extends Component {


    render() {

        const { dispatch, auth, showModal, closeModal } = this.props;
        const { currentView } = this.props.viewBuilder;
        const { samples, views, isValid } = this.props.userData;

        var disabledClass = classNames({
            'disabled': (auth.isDemo) ? 'disabled' : ''
        })
        var title = (auth.isDemo) ? 'Login or register to work with view' : 'Make a copy for editing';
        const isFilterEditable = (currentView.type === 'user');

        return (

            <div className="collapse in copyview">
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <label data-localize="views.setup.selector.label">Available Views</label>
                    </div>
                </div>
                { !isFilterEditable &&
                <div className="alert alert-help">
                    <span data-localize="views.setup.selector.description">
                        This view is not editable, duplicate it to make changes.
                    </span>
                </div>
                }
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <Select
                            options={views.map( v => { return {value: v.id, label: v.name} } )}
                            value={currentView.id}
                            clearable={false}
                            onChange={ (val) => dispatch(viewBuilderSelectView(views, val.value, true))}
                        />
                    </div>
                    <div className="col-sm-6">
                        <div className="btn-group" data-localize="actions.duplicate.help" data-toggle="tooltip"
                             data-placement="bottom" data-container="body" title="Сopy this to a new">
                            <button type="button"
                                    className="btn btn-default collapse in copyview"
                                    data-toggle="collapse"
                                    data-target=".copyview"
                                    id="dblBtn"
                                    onClick={ () => dispatch(viewBuilderToggleNewEdit(false)) }
                                    disabled={disabledClass}
                                    title={title}
                            >
                                <span data-localize="actions.duplicate.title">Duplicate</span>
                            </button>
                        </div>
                        {
                            //<!--   Видимы когда в селекторе выбраны пользовательские вью, которые можно редактировать -->
                        }
                        { currentView.type == 'user' &&
                        <div className="btn-group ">
                            <button type="button"
                                    className="btn btn-default"
                                    onClick={ () => dispatch(viewBuilderSelectView(views, currentView.id, true))}>

                                <span data-localize="views.setup.reset.title">Reset View</span>
                            </button>
                        </div>
                        }
                        { currentView.type == 'user' &&
                        <div className="btn-group ">
                            <button type="button" className="btn btn-link">
                                <span data-localize="views.setup.delete.title">Delete View</span>
                            </button>
                        </div>
                        }
                        { //<!-- / -->
                        }
                    </div>
                </div>
            </div>

        )
    }
}
