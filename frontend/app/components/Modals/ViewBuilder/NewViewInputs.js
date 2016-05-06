import React from 'react';
import {connect} from 'react-redux';
import {viewBuilderSelectView, viewBuilderChangeAttr} from '../../../actions/viewBuilder';


export default class NewViewInputs extends React.Component {

    render() {

        const {dispatch, viewBuilder, views} = this.props;
        const newView = viewBuilder.editedView;

        return (

            <div className='collapse in copyview'>
                <div className='row grid-toolbar'>

                    <div className='col-sm-6'>
                        <label data-localize='views.setup.new.name.title'>New View</label>
                        <input
                            type='text'
                            className='form-control text-primary'
                            data-localize='views.setup.new.name.help'
                            placeholder='Set view name a copy'
                            value={newView.name}
                            onChange={ (e) =>dispatch(viewBuilderChangeAttr({name: e.target.value, description: newView.description})) }
                        />
                        { !newView.name &&
                        <div className='help-text text-danger' data-localize='views.setup.new.name.error'>
                            View name cannot be empty
                        </div>
                        }
                    </div>

                    <div className='col-sm-5'>
                        <label data-localize='general.description'>Description</label>
                        <input
                            type='text'
                            className='form-control'
                            data-localize='views.setup.new.description'
                            placeholder="Set view description (optional)"
                            value={newView.description}
                            onChange={ (e) =>dispatch(viewBuilderChangeAttr({name: newView.name, description: e.target.value})) }
                        />
                    </div>

                    <div className='col-sm-1'>
                        <button type='button' className='btn btn-default btn-label-indent delete-copy' type='button'
                                data-toggle='collapse' data-target='.copyview '
                                onClick={ () => dispatch(viewBuilderSelectView(views, newView.originalViewId)) }><span
                            data-localize='actions.cancel'>Cancel</span></button>
                    </div>

                </div>
            </div>

        )
    }
}

function mapStateToProps(state) {
    const {viewBuilder, userData: {views}} = state;
    return {
        views,
        viewBuilder
    }
}

export default connect(mapStateToProps)(NewViewInputs);
