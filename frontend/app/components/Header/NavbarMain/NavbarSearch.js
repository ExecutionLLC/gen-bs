import React, { Component } from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';

class NavbarSearch extends Component {
    constructor(props) {
        super(props);
        this.state = {
            search: this.props.search,
            showPopup: false
        };
    }

    componentWillReceiveProps(newProps) {
        this.state = {
            ...this.state,
            search: newProps.search
        };
    }

    render() {
        const isEnabled = !this.props.isVariantsLoading && this.props.isVariantsValid;
        return (
            <div className={classNames({'navbar-search': true, 'navbar-search-xs': this.state.showPopup})}>
                <a
                    className='btn navbar-btn btn-block visible-xs'
                    type='button'
                    onClick={() => this.onSearchPopupToggle()}
                ><i className='md-i'>search</i></a>
                <div className='navbar-search-field'>
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
                    <a type='button' className='btn btn-link-inverse btn-field-clean visible-xs' id='closeMobileSearch'><i className='md-i'>close</i></a>
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

    onSearchPopupToggle() {
        this.setState({...this.state, showPopup: !this.state.showPopup});
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
