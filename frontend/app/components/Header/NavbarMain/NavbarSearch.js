import React, { Component } from 'react';
import { connect } from 'react-redux';
import {changeGlobalString} from '../../../actions/ui';

export default class NavbarSearch extends Component {
    constructor(props) {
        super(props);
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
                     value={this.props.globalSearchString}
                    />
                </div>
            </div>
        );
    }

    onGlobalSearchInputChanged(e) {
        const {dispatch} = this.props;
        dispatch(changeGlobalString(e.target.value));
    }

    onGlobalSearchInputKeyPressed(e) {
        // user pressed "enter"
        if (e.charCode === 13) {
            const { globalSearchString, onGlobalSearchRequested} = this.props;
            onGlobalSearchRequested(globalSearchString);
        }
    }

    onGlobalSearchInputBlur() {
        const { globalSearchString, onGlobalSearchRequested} = this.props;
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
