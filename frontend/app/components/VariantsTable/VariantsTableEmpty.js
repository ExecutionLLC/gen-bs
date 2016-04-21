import React, { Component } from 'react';

export default class VariantsTableEmpty extends Component {

    render() {
        return (
            <div className="table-variants-body">
                <div className="empty">
                    <div className="panel panel-success">
                        <div className="panel-body">
                            <h3 className="text-center">
                                Results are empty!
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

        )
    }
}
