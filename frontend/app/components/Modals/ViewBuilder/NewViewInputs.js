import React from 'react';
import {viewBuilderChangeAttr, viewBuilderRestartEdit} from '../../../actions/viewBuilder';
import config from '../../../../config';
import * as i18n from '../../../utils/i18n';

export default class NewViewInputs extends React.Component {

    render() {

        const {viewBuilder, validationMessage, ui: {languageId}} = this.props;
        const newView = viewBuilder.editingView;

        return (
            <div className='form-rows'>
                { validationMessage &&
                <div className='alert alert-help'>
                        <span data-localize='views.setup.selector.description'>
                            {validationMessage}
                        </span>
                </div>
                }
                <div className='form-group row-new-item'>
                    <div className='col-sm-6'>
                        <label data-localize='views.setup.new.name.title'>New View</label>
                        <input
                            type='text'
                            className='form-control text-primary'
                            data-localize='views.setup.new.name.help'
                            placeholder='Set view name'
                            value={i18n.getEntityText(newView, languageId).name}
                            maxLength={config.VIEWS.MAX_NAME_LENGTH}
                            onChange={(e) => this.onNameChange(e.target.value)}
                        />
                    </div>
                    <div className='col-sm-6 input-group'>
                        <label data-localize='general.description'>Description</label>
                        <input
                            type='text'
                            className='form-control'
                            data-localize='views.setup.new.description'
                            placeholder='Set view description (optional)'
                            value={i18n.getEntityText(newView, languageId).description}
                            maxLength={config.VIEWS.MAX_DESCRIPTION_LENGTH}
                            onChange={(e) => this.onDescriptionChange(e.target.value)}
                        />
                        <div className='input-group-btn btn-group-close'>
                            <button type='button' className='btn-link-default'
                                    onClick={() => this.onCancelClick()}>
                                <i className='md-i'>close</i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    onNameChange(name) {
        const {editingView} = this.props.viewBuilder;
        const {ui: {languageId}} = this.props;
        this.props.dispatch(viewBuilderChangeAttr(
            {
                name,
                description: i18n.getEntityText(editingView, languageId).description
            },
            languageId
        ));
    }

    onDescriptionChange(description) {
        const {editingView} = this.props.viewBuilder;
        const {ui: {languageId}} = this.props;
        this.props.dispatch(viewBuilderChangeAttr(
            {
                name: i18n.getEntityText(editingView, languageId).name,
                description
            },
            languageId
        ));
    }

    onCancelClick() {
        const {dispatch, viewBuilder, viewsList, ui: {languageId}} = this.props;
        const parentView = viewsList.hashedArray.hash[viewBuilder.editingViewParentId];
        dispatch(viewBuilderRestartEdit(false, parentView, languageId));
    }

}
