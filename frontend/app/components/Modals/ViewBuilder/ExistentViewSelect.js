import React from 'react';
import Select from '../../shared/Select';
import 'react-select/dist/react-select.css';
import _ from 'lodash';

import {
    getItemLabelByNameAndType,
    getReadonlyReasonForSessionAndType
} from '../../../utils/stringUtils';
import {
    viewBuilderStartEdit,
    viewBuilderDeleteView
} from '../../../actions/viewBuilder';


export default class ExistentViewSelect extends React.Component {

    render() {
        const {auth: {isDemo: isDemoSession}, viewBuilder: {editingView: {type: selectedViewType}}, viewsList: {views}} = this.props;
        const isEditableView = selectedViewType === 'user';

        return (
            <div className='collapse in'>
                <div className='row grid-toolbar'>
                    {this.renderTitle()}
                </div>
                {this.renderDescription(isDemoSession, selectedViewType)}
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

    renderDescription(isDemoSession, selectedViewType) {
        const descriptionText = getReadonlyReasonForSessionAndType('view', isDemoSession, selectedViewType);

        if (descriptionText) {
            return (
                <div className='alert alert-help'>
                    <span data-localize='views.setup.selector.description'>
                        {descriptionText}
                    </span>
                </div>
            );
        }

        return null;
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
        return _.find(this.props.viewsList.views, {id: viewId});
    }

    onSelectedViewChanged(viewId) {
        const {dispatch} = this.props;
        dispatch(viewBuilderStartEdit(false, this.getViewForId(viewId)));
    }

    onDuplicateViewClick() {
        const {dispatch} = this.props;
        const editingView = this.props.viewBuilder.editingView;
        dispatch(viewBuilderStartEdit(true, editingView));
    }

    onResetViewClick() {
        const {dispatch} = this.props;
        const editingViewId = this.getEditingViewId();
        dispatch(viewBuilderStartEdit(false, this.getViewForId(editingViewId)));
    }

    onDeleteViewClick() {
        const {dispatch} = this.props;
        const editingViewId = this.getEditingViewId();
        dispatch(viewBuilderDeleteView(editingViewId));
    }
}
