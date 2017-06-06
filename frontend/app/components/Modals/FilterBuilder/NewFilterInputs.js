import React, {Component, PropTypes} from 'react';

import {filterBuilderChangeAttr, filterBuilderRestartEdit} from '../../../actions/filterBuilder';
import config from '../../../../config';
import * as i18n from '../../../utils/i18n';

export default class NewFilterInputs extends Component {

    render() {

        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        const {validationMessage, texts, ui: {languageId}} = this.props;

        return (
            <div className='form-rows'>
                { validationMessage &&
                <div className='alert alert-help'>
                    <span>{validationMessage}</span>
                </div>
                }
                <div className='form-group row-new-item'>
                      <div className='col-sm-6'>
                          <label>{texts.p('newInputs.newCaption')}</label>
                          <input
                              type='text'
                              className='form-control text-primary'
                              placeholder={texts.p('newInputs.namePlaceholder')}
                              value={i18n.getEntityText(editingFilter, languageId).name}
                              maxLength={config.FILTERS.MAX_NAME_LENGTH}
                              onChange={(e) => this.onNameChange(e.target.value)}
                          />
                      </div>
                      <div className='col-sm-6 input-group'>
                          <label>{texts.p('newInputs.description')}</label>
                          <input
                              type='text'
                              className='form-control'
                              placeholder={texts.p('newInputs.descriptionPlaceholder')}
                              value={i18n.getEntityText(editingFilter, languageId).description}
                              maxLength={config.FILTERS.MAX_DESCRIPTION_LENGTH}
                              onChange={(e) => this.onDescriptionChange(e.target.value)}
                          />
                          <div className='input-group-btn  btn-group-close'>
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
        const {dispatch, filterBuilder, ui: {languageId}} = this.props;
        const editingFilter = filterBuilder.editingFilter.filter;
        dispatch(filterBuilderChangeAttr(
            {
                name,
                description: i18n.getEntityText(editingFilter, languageId).description
            },
            languageId
        ));
    }

    onDescriptionChange(description) {
        const {dispatch, filterBuilder, ui: {languageId}} = this.props;
        const editingFilter = filterBuilder.editingFilter.filter;
        dispatch(filterBuilderChangeAttr(
            {
                name: i18n.getEntityText(editingFilter, languageId).name,
                description
            },
            languageId
        ));
    }

    onCancelClick() {
        const {dispatch, filterBuilder, ui: {languageId}} = this.props;
        const parentFilter = filterBuilder.filtersList.hashedArray.hash[filterBuilder.editingFilter.parentFilterId];
        dispatch(filterBuilderRestartEdit(null, parentFilter, languageId));
    }

}

NewFilterInputs.propTypes = {
    filterBuilder: PropTypes.object.isRequired,
    ui: PropTypes.object.isRequired,
    validationMessage: PropTypes.string.isRequired,
    texts: PropTypes.shape({p: PropTypes.func.isRequired}).isRequired,
    dispatch: PropTypes.func.isRequired
};
