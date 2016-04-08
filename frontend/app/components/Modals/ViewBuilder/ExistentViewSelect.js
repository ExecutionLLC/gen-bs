import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {viewBuilderToggleEdit, viewBuilderSelectView, viewBuilderToggleNew} from '../../../actions/viewBuilder'


export default class ExistentViewSelect extends React.Component {


    render() {

        const {dispatch, auth, viewBuilder, views} = this.props;
        const view = viewBuilder.editedView;

        var disabledClass = classNames({
            'disabled': (auth.isDemo) ? 'disabled' : ''
        });
        var title = (auth.isDemo) ? 'Login or register to work with view' : 'Make a copy for editing';
        const isViewEditable = (view.type === 'user');

        return (

            <div className="collapse in copyview">
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <label data-localize="views.setup.selector.label">Available Views</label>
                    </div>
                </div>
                { !isViewEditable &&
                <div className="alert alert-help">
                    <span data-localize="views.setup.selector.description">
                        This view is not editable, duplicate it to make changes. (Only for registered users)
                    </span>
                </div>
                }
                <div className="row grid-toolbar">
                    <div className="col-sm-6">
                        <Select
                            options={views.map( v => { return {value: v.id, label: v.name} } )}
                            value={view.id}
                            clearable={false}
                            onChange={ (val) => dispatch(viewBuilderToggleEdit(views, val.value, true))}
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
                                    onClick={ () => dispatch(viewBuilderToggleNew()) }
                                    disabled={disabledClass}
                                    title={title}
                            >
                                <span data-localize="actions.duplicate.title">Duplicate</span>
                            </button>
                        </div>
                        {
                            //<!--   Видимы когда в селекторе выбраны пользовательские вью, которые можно редактировать -->
                        }
                        { view.type == 'user' &&
                        <div className="btn-group ">
                            <button type="button"
                                    className="btn btn-default"
                                    onClick={ () => dispatch(viewBuilderSelectView(views, view.id, true))}>

                                <span data-localize="views.setup.reset.title">Reset View</span>
                            </button>
                        </div>
                        }
                        { view.type == 'user' &&
                        <div className="btn-group ">
                            <button type="button" className="btn btn-link">
                                <span data-localize="views.setup.delete.title">Delete View</span>
                            </button>
                        </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

function mapStateToProps(state) {
    const {viewBuilder, auth, userData} = state;
    const views = userData.views;
    return {
        auth,
        viewBuilder,
        views
    }
}

export default connect(mapStateToProps)(ExistentViewSelect);
