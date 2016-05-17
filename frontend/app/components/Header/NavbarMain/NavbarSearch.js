import React, { Component } from 'react';
import { connect } from 'react-redux';


export default class NavbarSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            globalSearchString: ''
        };
    }

    render() {
        const isEnabled = !this.props.isVariantsLoading && this.props.isVariantsValid;
        return (
            <div className='navbar-search'>
                <a data-target='#mobileSearch' data-toggle='modal' className='btn navbar-btn btn-block visible-xxs' type='button'><i className='md-i'>search</i></a>
                <div className='navbar-search-field hidden-xxs'>
                    <input
                     type='text'
                     data-localize='results.search'
                     className='form-control placeholder-inverse'
                     placeholder='Search for mutations of current sample analysis'
                     data-localize=''
                     onChange={(e) => this.onGlobalSearchInputChanged(e)}
                     onKeyPress={(e) => this.onGlobalSearchInputKeyPressed(e)}
                     onBlur={(e) => this.onGlobalSearchInputBlur()}
                     disabled={!isEnabled}
                    />
                </div>
            </div>
        );
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

function mapStateToProps(state) {
    const { websocket: {isVariantsLoading, isVariantsValid} } = state;
    return { isVariantsLoading, isVariantsValid };
}

export default connect(mapStateToProps)(NavbarSearch);

NavbarSearch.propTypes = {
    isVariantsLoading: React.PropTypes.bool.isRequired,
    isVariantsValid: React.PropTypes.bool.isRequired,
    // callback(globalSearchString)
    onGlobalSearchRequested: React.PropTypes.func.isRequired,
    // callback(globalSearchString)
    onGlobalSearchStringChanged: React.PropTypes.func.isRequired
};
