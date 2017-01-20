import React from 'react';
import 'react-select/dist/react-select.css';

import Select from '../../shared/Select';
import {
    getItemLabelByNameAndType,
    getReadonlyReasonForSessionAndType
} from '../../../utils/stringUtils';
import {
    viewBuilderRestartEdit,
    viewBuilderDeleteView,
    fireOnSaveAction
} from '../../../actions/viewBuilder';
import {entityTypeIsEditable} from '../../../utils/entityTypes';
import * as i18n from '../../../utils/i18n';


export default class ExistentViewSelect extends React.Component {

    render() {
        const {auth: {isDemo: isDemoSession}, viewBuilder: {editingView: {type: selectedViewType}}, viewsList: {hashedArray: {array: views}}} = this.props;
        const isEditableView = entityTypeIsEditable(selectedViewType);

        return (
            <div className='form-rows'>
                <div className='form-group'>
                    {this.renderTitle()}
                </div>
                {this.renderWarning(isDemoSession, selectedViewType)}
                <div className='form-group row-head-selector'>
                    <div className='col-sm-12 col-md-11 col-lg-9 btn-group-select-group'>
                        {this.renderViewSelector(views)}
                        {this.renderButtonGroup(isDemoSession, isEditableView)}
                    </div>  
                </div>
            </div>
        );
    }

    renderTitle() {
        return (
            <h5 data-localize='views.setup.selector.label'>Available Views</h5>
        );
    }

    renderWarning(isDemoSession, selectedViewType) {
        const warningText = getReadonlyReasonForSessionAndType('view', isDemoSession, selectedViewType);

        if (!warningText) {
            return null;
        }
        return (
            <div className='alert alert-help'>
                <span data-localize='views.setup.selector.description'>
                    {warningText}
                </span>
            </div>
        );
    }

    renderViewSelector(views) {
        const {ui: {languageId}} = this.props;

        const selectorItems = views.map( viewItem => ({
            value: viewItem.id,
            label: getItemLabelByNameAndType(i18n.getEntityText(viewItem, languageId).name, viewItem.type)
        }));

        return (
            <div className='btn-group btn-group-select-group-max'>
                <Select
                    options={selectorItems}
                    value={this.getEditingViewId()}
                    onChange={(item) => this.onSelectedViewChanged(item.value)}
                />
            </div>
        );
    }

    renderButtonGroup(isDemoSession, isEditableView) {
        return (
            <div className='btn-group'>
                {this.renderDuplicateViewButton(isDemoSession)}
                {isEditableView && this.renderResetViewButton()}
                {isEditableView && this.renderDeleteViewButton()}
            </div>
        );
    }

    renderDuplicateViewButton(isDemoSession) {
        const duplicateButtonTooltip = isDemoSession ? 'Login or register to work with view' : 'Make a copy for editing';
        return (
            <button type='button'
                    className='btn btn-default'
                    id='dblBtn'
                    onClick={() => this.onDuplicateViewClick()}
                    disabled={isDemoSession}
                    title={duplicateButtonTooltip}
            >
                <span data-localize='actions.duplicate.title' className='hidden-xs'>Duplicate</span>
                <span className='visible-xs'><i className='md-i'>content_copy</i></span>
            </button>
        );
    }

    renderResetViewButton() {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onResetViewClick()}
            >
                <span data-localize='views.setup.reset.title' className='hidden-xs'>Reset View</span>
                <span className='visible-xs'><i className='md-i'>settings_backup_restore</i></span>
            </button>
        );
    }

    renderDeleteViewButton() {
        return (
            <button type='button'
                    className='btn btn-default'
                    onClick={() => this.onDeleteViewClick()}
            >
                <span data-localize='views.setup.delete.title' className='hidden-xs'>Delete View</span>
                <span className='visible-xs'><i className='md-i'>close</i></span>
            </button>
        );
    }

    getEditingViewId() {
        return this.props.viewBuilder.editingView.id;
    }

    getViewForId(viewId) {
        return this.props.viewsList.hashedArray.hash[viewId];
    }

    onSelectedViewChanged(viewId) {
        const {dispatch, ui: {languageId}} = this.props;
        dispatch(viewBuilderRestartEdit(false, this.getViewForId(viewId), languageId));
    }

    onDuplicateViewClick() {
        const {dispatch, viewBuilder, ui: {languageId}} = this.props;
        const editingView = viewBuilder.editingView;
        dispatch(viewBuilderRestartEdit(true, editingView, languageId));
    }

    onResetViewClick() {
        const {dispatch, ui: {languageId}} = this.props;
        const editingViewId = this.getEditingViewId();
        dispatch(viewBuilderRestartEdit(false, this.getViewForId(editingViewId), languageId));
    }

    onDeleteViewClick() {
        const {dispatch, ui: {languageId}} = this.props;
        const editingViewId = this.getEditingViewId();
        dispatch(viewBuilderDeleteView(editingViewId, languageId)).then((newView) => {
            dispatch(fireOnSaveAction(newView));
        });
    }
}
