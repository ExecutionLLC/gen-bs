import React from 'react';
import Select from '../../shared/Select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import _ from 'lodash';

import {
    getItemLabelByNameAndType,
    getReadonlyReasonForSessionAndType
} from '../../../utils/stringUtils';
import {
    viewBuilderSelectView,
    viewBuilderToggleNew,
    viewBuilderStartEdit,
    viewBuilderDeleteView
} from '../../../actions/viewBuilder';


export default class ExistentViewSelect extends React.Component {

    render() {
        const {auth: {isDemo: isDemoSession}, viewBuilder: {editedView: selectedView}, userData: {views}} = this.props; // TODO sv: editedView->editingView, get type
        const isEditableView = selectedView.type === 'user';

        return (
            <div className='collapse in'>
                <div className='row grid-toolbar'>
                    {this.renderTitle()}
                </div>
                {this.renderDescription(isDemoSession, selectedView.type)}
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
        const selectorItems = views.map(
            (viewItem) => {
                const value = viewItem.id;
                const label = getItemLabelByNameAndType(viewItem.name, viewItem.type);
                return {value, label};
            }
        );

        return (
            <div className='col-sm-6'>
                <Select options={selectorItems}
                        value={this.getSelectedViewId()}
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
        const disabledClass = classNames({
            'disabled': (isDemoSession) ? 'disabled' : ''
        });

        return (
            <button type='button'
                    className='btn btn-default collapse in'
                    id='dblBtn'
                    onClick={ () => {this.onDuplicateViewClick();} }
                    disabled={disabledClass}
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
                    onClick={ () => {this.onResetViewClick();} }
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
                    onClick={ () => {this.onDeleteViewClick();} }
            >
                <span data-localize='views.setup.delete.title' className='hidden-xs'>Delete View</span>
                <span className='visible-xs'><i className='md-i'>close</i></span>
            </button>
        );
    }

    getSelectedViewId() {
        return this.props.viewBuilder.editedView.id;
    }

    getViewForId(viewId) {
        return _.find(this.props.views, {id: viewId});
    }

    onSelectedViewChanged(viewId) {
        const {dispatch, userData: {views}} = this.props;
        dispatch(viewBuilderSelectView(views, viewId));  // TODO replace by dispatch(viewBuilderStartEdit(false, this.getViewForId(viewId)));
    }

    onDuplicateViewClick() {
        const {dispatch} = this.props;
        dispatch(viewBuilderToggleNew()); // TODO replace by const selectedViewId = this.getSelectedViewId();dispatch(viewBuilderStartEdit(true, this.getViewForId(selectedViewId)));
    }

    onResetViewClick() {
        const {dispatch, userData: {views}} = this.props;
        const selectedViewId = this.getSelectedViewId();
        dispatch(viewBuilderSelectView(views, selectedViewId)); // TODO replace by dispatch(viewBuilderStartEdit(false, this.getViewForId(selectedViewId)));
    }

    onDeleteViewClick() {
        const {dispatch} = this.props;
        const selectedViewId = this.getSelectedViewId();
        dispatch(viewBuilderDeleteView(selectedViewId));
    }
}
