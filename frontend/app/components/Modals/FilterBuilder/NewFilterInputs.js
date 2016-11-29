import React, {Component} from 'react';

import {filterBuilderChangeAttr, filterBuilderRestartEdit} from '../../../actions/filterBuilder';
import config from '../../../../config';

export default class NewFilterInputs extends Component {

    render() {

        const editingFilter = this.props.filterBuilder.editingFilter.filter;
        const {validationMessage, texts} = this.props;

        return (
            <div className='form-rows-dynamic collapse in'>
                { validationMessage &&
                <div className='alert alert-help'>
                        <span data-localize='filters.setup.selector.description'>
                            {validationMessage}
                        </span>
                </div>
                }
                <div className='form-group row-head-selector'>
                      <div className='col-sm-6'>
                          <label data-localize='filters.setup.new.name.title'>New {texts.Filter}</label>
                          <input
                              type='text'
                              className='form-control text-primary'
                              data-localize='filters.setup.new.name.help'
                              placeholder={`Set ${texts.filter} name`}
                              value={editingFilter.name}
                              maxLength={config.FILTERS.MAX_NAME_LENGTH}
                              onChange={(e) => this.onNameChange(e.target.value)}
                          />
                      </div>
                      <div className='col-sm-6 input-group'>
                          <label data-localize='general.description'>Description</label>
                          <input
                              type='text'
                              className='form-control'
                              data-localize='filters.setup.new.description'
                              placeholder={`Set ${texts.filter} description (optional)`}
                              value={editingFilter.description}
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
        const {dispatch, filterBuilder} = this.props;
        const editingFilter = filterBuilder.editingFilter.filter;
        dispatch(filterBuilderChangeAttr({
            name,
            description: editingFilter.description
        }));
    }

    onDescriptionChange(description) {
        const {dispatch, filterBuilder} = this.props;
        const editingFilter = filterBuilder.editingFilter.filter;
        dispatch(filterBuilderChangeAttr({
            name: editingFilter.name,
            description
        }));
    }

    onCancelClick() {
        const {dispatch, filterBuilder} = this.props;
        const parentFilter = filterBuilder.filtersList.hashedArray.hash[filterBuilder.editingFilter.parentFilterId];
        dispatch(filterBuilderRestartEdit(false, parentFilter));
    }

}
