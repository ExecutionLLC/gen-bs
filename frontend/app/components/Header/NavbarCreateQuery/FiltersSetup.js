import React, {Component} from 'react';
import Select2 from 'react-select2-wrapper';


export default class FiltersSetup extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (

            <div className="table-cell">
                <div className="btn-group" data-localize="filters.setup.help" data-toggle="tooltip"
                     data-placement="bottom" data-container="body"
                     title="Setup, create custom new filters">
                    <button
                        className="btn btn-default"
                        type="button"
                        data-toggle="modal"
                        data-target="#filter"
                        onClick={this.props.openModal.bind(this, 'filters')}
                    >
                        <span data-localize="filters.setup.title">Filters</span>
                    </button>
                </div>
            </div>


        )
    }
}
