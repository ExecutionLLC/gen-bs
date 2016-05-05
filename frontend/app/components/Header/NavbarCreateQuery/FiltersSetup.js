import React, {Component} from 'react';
import Select2 from 'react-select2-wrapper';
import {filterBuilderToggleNewEdit} from '../../../actions/filterBuilder'


export default class FiltersSetup extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (

            <div className='table-cell'>
                <div className='btn-group' data-localize='filters.setup.help' data-toggle='tooltip'
                     data-placement='bottom' data-container='body'
                     title='Select existing filter or create a new one'>
                    <button
                        className='btn btn-default'
                        type='button'
                        data-toggle='modal'
                        data-target='#filter'
                        onClick={() => {
                            this.props.dispatch(filterBuilderToggleNewEdit(false, this.props.fields));
                            this.props.openModal('filters');
                        }}
                    >
                        <span data-localize='filters.setup.title'>Filters</span>
                    </button>
                </div>
            </div>


        )
    }
}
