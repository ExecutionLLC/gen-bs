import React, { Component } from 'react';


export default class NavbarSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            globalSearchString: ""
        };
    }

    render() {
        return (
            <div className="navbar-search">
                <div className="navbar-search-field width">
                    <input
                     type="text"
                     data-localize="results.search"
                     className="form-control placeholder-inverse"
                     placeholder="Search for mutations of current sample analysis"
                     data-localize=""
                     onChange={(e) => this.onGlobalSearchInputChanged(e)}
                     onKeyPress={(e) => this.onGlobalSearchInputKeyPressed(e)}
                     onBlur={(e) => this.onGlobalSearchInputBlur()}
                    />
                </div>
            </div>
        )
    }

    onGlobalSearchInputChanged(e) {
        this.setState({
            globalSearchString: e.target.value
        });
    }

    onGlobalSearchInputKeyPressed(e) {
        // user pressed "enter"
        if (e.charCode === 13) {
            const { globalSearchString } = this.state;
            const { onGlobalSearchRequested } = this.props;
            onGlobalSearchRequested(globalSearchString);
        }
    }

    onGlobalSearchInputBlur() {
        const { globalSearchString } = this.state;
        const { onGlobalSearchStringChanged } = this.props;
        onGlobalSearchStringChanged(globalSearchString);
    }
}
