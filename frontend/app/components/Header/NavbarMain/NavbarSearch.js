import React, { Component } from 'react';
import { connect } from 'react-redux';

class NavbarSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            search: this.props.search
        };
    }

    componentWillReceiveProps(newProps) {
        this.state = {
            search: newProps.search
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
                     onBlur={() => this.onGlobalSearchInputBlur()}
                     disabled={!isEnabled}
                     value={this.state.search}
                    />
                </div>
            </div>
        );
    }

    onGlobalSearchInputChanged(e) {
        this.setState({
            search: e.target.value
        });
    }

    onGlobalSearchInputKeyPressed(e) {
        // user pressed "enter"
        if (e.charCode === 13) {
            const { search } = this.state;
            const { onGlobalSearchRequested } = this.props;
            onGlobalSearchRequested(search);
        }
    }

    onGlobalSearchInputBlur() {
        const { search } = this.state;
        const { onGlobalSearchStringChanged } = this.props;
        onGlobalSearchStringChanged(search);
    }
}

function mapStateToProps(state) {
    const { websocket: {isVariantsLoading, isVariantsValid} } = state;
    return { isVariantsLoading, isVariantsValid };
}

NavbarSearch.propTypes = {
    isVariantsLoading: React.PropTypes.bool.isRequired,
    isVariantsValid: React.PropTypes.bool.isRequired,
    // callback(globalSearchString)
    onGlobalSearchRequested: React.PropTypes.func.isRequired,
    // callback(globalSearchString)
    onGlobalSearchStringChanged: React.PropTypes.func.isRequired,
    search: React.PropTypes.string.isRequired
};

export default connect(mapStateToProps)(NavbarSearch);
