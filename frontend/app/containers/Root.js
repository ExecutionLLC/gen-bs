import React, {Component} from 'react';
import {Provider} from 'react-redux';
import configureStore from '../store/configureStore';
import App from './App';

const store = configureStore();
// it is workaround for the keep alive task
// IMPORTANT: do not use window.reduxStore, it is dangerous
window.reduxStore = store;

export default class Root extends Component {
    render() {
        return (
            <Provider store={store}>
                <App />
            </Provider>
        );
    }
}
