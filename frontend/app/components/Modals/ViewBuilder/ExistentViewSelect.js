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


export default class ExistentViewSelect extends React.Component {

    render() {
        const {auth: {isDemo: isDemoSession}, viewBuilder: {editingView: {type: selectedViewType}}, viewsList: {hashedArray: {array: views}}} = this.props;
        const isEditableView = entityTypeIsEditable(selectedViewType);

        return (
            <div className='collapse in'>
                <div className='row grid-toolbar'>
                    {this.renderTitle()}
                </div>
                {this.renderWarning(isDemoSession, selectedViewType)}
                <div className='row grid-toolbar row-head-selector'>
                    {this.renderViewSelector(views)}
                    {this.renderButtonGroup(isDemoSession, isEditableView)}
                </div>
            </div>
        );
    }

    renderTitle() {
        return (
            <div className='col-sm-6'>
                <label data-localize='views.setup.selector.label'>Available Views</label>
            </div>
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
        const selectorItems = views.map( viewItem => ({
            value: viewItem.id,
            label: getItemLabelByNameAndType(viewItem.name, viewItem.type)
        }));

        return (
            <div className='col-sm-6'>
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
            <div className='col-sm-6'>
                <div className='btn-group'>
                    {this.renderDuplicateViewButton(isDemoSession)}
                    {isEditableView && this.renderResetViewButton()}
                    {isEditableView && this.renderDeleteViewButton()}
                </div>
            </div>
        );
    }

    renderDuplicateViewButton(isDemoSession) {
        const duplicateButtonTooltip = isDemoSession ? 'Login or register to work with view' : 'Make a copy for editing';
        return (
            <button type='button'
                    className='btn btn-default collapse in'
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
        const {dispatch} = this.props;
        dispatch(viewBuilderRestartEdit(false, this.getViewForId(viewId)));
    }

    onDuplicateViewClick() {
        const {dispatch} = this.props;
        const editingView = this.props.viewBuilder.editingView;
        dispatch(viewBuilderRestartEdit(true, editingView));
    }

    onResetViewClick() {
        const {dispatch} = this.props;
        const editingViewId = this.getEditingViewId();
        dispatch(viewBuilderRestartEdit(false, this.getViewForId(editingViewId)));
    }

    onDeleteViewClick() {
        const {dispatch} = this.props;
        const editingViewId = this.getEditingViewId();
        dispatch(viewBuilderDeleteView(editingViewId)).then((newView) => {
            dispatch(fireOnSaveAction(newView));
        });
    }
}
