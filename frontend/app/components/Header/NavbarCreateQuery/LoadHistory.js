import React, { Component } from 'react';


export default class LoadHistory extends Component {

    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="table-cell">
                <div className="btn-group btn-group-history"
                     data-localize="history.help"
                     data-toggle="tooltip"
                     data-placement="bottom"
                     data-container="body"
                     title="History of queries, saved query settings"
                >
                    <button className="btn btn-default"
                            type="button"
                            onClick={ () => {this.props.openModal('queryHistory')} }
                    >
                        <span data-localize="history.title">
                            Load history
                        </span>
                    </button>
                </div>
            </div>
        )
    }
}
