import React from 'react';
import {viewBuilderChangeAttr, viewBuilderRestartEdit} from '../../../actions/viewBuilder';
import config from '../../../../config';
import * as i18n from '../../../utils/i18n';

export default class NewViewInputs extends React.Component {

    render() {

        const {viewBuilder, validationMessage, ui: {languageId}, p} = this.props;
        const newView = viewBuilder.editingView;

        return (
            <div className='form-rows'>
                { validationMessage &&
                <div className='alert alert-help'>
                    <span>
                        {validationMessage}
                    </span>
                </div>
                }
                <div className='form-group row-new-item'>
                    <div className='col-sm-6'>
                        <label>{p.t('view.newViewInputs.newView')}</label>
                        <input
                            type='text'
                            className='form-control text-primary'
                            data-localize='views.setup.new.name.help'
                            placeholder={p.t('view.newViewInputs.namePlaceholder')}
                            value={i18n.getEntityText(newView, languageId).name}
                            maxLength={config.VIEWS.MAX_NAME_LENGTH}
                            onChange={(e) => this.onNameChange(e.target.value)}
                        />
                    </div>
                    <div className='col-sm-6 input-group'>
                        <label>{p.t('view.newViewInputs.description')}</label>
                        <input
                            type='text'
                            className='form-control'
                            placeholder={p.t('view.newViewInputs.descriptionPlaceholder')}
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
