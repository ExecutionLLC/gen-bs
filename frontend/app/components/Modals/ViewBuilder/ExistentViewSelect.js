import React from 'react';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import classNames from 'classnames';
import {connect} from 'react-redux';

import {getItemLabelByNameAndType} from '../../../utils/stringUtils';
import {
    viewBuilderToggleEdit,
    viewBuilderSelectView,
    viewBuilderToggleNew,
    viewBuilderDeleteView
} from '../../../actions/viewBuilder'


export default class ExistentViewSelect extends React.Component {

    render() {
        const {auth: {isDemo: isDemoSession}, viewBuilder: {editedView: selectedView}, views} = this.props;
        const isEditableView = selectedView.type === 'user';

        return (
            <div className="collapse in copyview">
                <div className="row grid-toolbar">
                    {this.renderTitle()}
                </div>
                {this.renderDescription(isDemoSession, selectedView.type)}
                <div className="row grid-toolbar">
                    {this.renderViewSelector(views)}
                    {this.renderButtonGroup(isDemoSession, isEditableView)}
                </div>
            </div>
        )
    }

    renderTitle() {
        return (
            <div className="col-sm-6">
                <label data-localize="views.setup.selector.label">Available Views</label>
            </div>
        )
    }

    renderDescription(isDemoSession, selectedViewType) {
        var descriptionText = 'This view is not editable, duplicate it to make changes.';
        descriptionText = isDemoSession ? descriptionText + ' (Only for registered users)' : descriptionText;
        switch (selectedViewType) {
            case 'history':
                descriptionText = 'This view is history view, duplicate it to make changes.';
            case 'user':
                descriptionText = '';
        }

        if (descriptionText) {
            return (
                <div className="alert alert-help">
                    <span data-localize="views.setup.selector.description">
                        {descriptionText}
                    </span>
                </div>
            )
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
            <div className="col-sm-6">
                <Select options={selectorItems}
                        value={this.getSelectedViewId()}
                        clearable={false}
                        onChange={(item) => this.onSelectedViewChanged(item.value)}
                />
            </div>
        )
    }

    renderButtonGroup(isDemoSession, isEditableView) {
        return (
            <div className="col-sm-6">
                {this.renderDuplicateViewButton(isDemoSession)}
                {isEditableView && this.renderResetViewButton()}
                {isEditableView && this.renderDeleteViewButton()}
            </div>
        )
    }

    renderDuplicateViewButton(isDemoSession) {
        const duplicateButtonTooltip = isDemoSession ? 'Login or register to work with view' : 'Make a copy for editing';
        const disabledClass = classNames({
            'disabled': (isDemoSession) ? 'disabled' : ''
        });

        return (
            <div className="btn-group">
                <button type="button"
                        className="btn btn-default collapse in copyview"
                        id="dblBtn"
                        onClick={ () => {this.onDuplicateViewClick()} }
                        disabled={disabledClass}
                        title={duplicateButtonTooltip}
                >
                    <span data-localize="actions.duplicate.title">Duplicate</span>
                </button>
            </div>
        )
    }

    renderResetViewButton() {
        return (
            <div className="btn-group">
                <button type="button"
                        className="btn btn-default"
                        onClick={ () => {this.onResetViewClick()} }
                >
                    <span data-localize="views.setup.reset.title">Reset View</span>
                </button>
            </div>
        )
    }

    renderDeleteViewButton() {
        return (
            <div className="btn-group">
                <button type="button"
                        className="btn btn-default"
                        onClick={ () => {this.onDeleteViewClick()} }
                >
                    <span data-localize="views.setup.delete.title">Delete View</span>
                </button>
            </div>
        )
    }

    getSelectedViewId() {
        return this.props.viewBuilder.editedView.id;
    }

    onSelectedViewChanged(viewId) {
        const {dispatch, views} = this.props;
        dispatch(viewBuilderToggleEdit(views, viewId, true));
    }

    onDuplicateViewClick() {
        const {dispatch} = this.props;
        dispatch(viewBuilderToggleNew());
    }

    onResetViewClick() {
        const {dispatch, views} = this.props;
        const selectedViewId = this.getSelectedViewId();
        dispatch(viewBuilderSelectView(views, selectedViewId, true));
    }

    onDeleteViewClick() {
        const {dispatch} = this.props;
        const selectedViewId = this.getSelectedViewId();
        dispatch(viewBuilderDeleteView(selectedViewId));
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
