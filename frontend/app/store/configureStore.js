import {createStore, applyMiddleware, compose} from 'redux';

// Allows to call an action after an inactivity timeout.
import {reduxTimeout} from 'redux-timeout';
// Allows to dispatch arrays of actions (by returning array of actions)
import reduxMulti from 'redux-multi';
// Allows async action dispatch (by returning a function from action instead of object)
import thunkMiddleware from 'redux-thunk';
// Now send only one notification when dispatching multiple actions
import {batchedSubscribe} from 'redux-batched-subscribe';
// Nice states logging
import createLogger from 'redux-logger';

import rootReducer from '../reducers';

const loggerMiddleware = createLogger();
const timeoutMiddleware = reduxTimeout();

const createStoreWithMiddleware = compose(
    applyMiddleware(
        thunkMiddleware,
        reduxMulti,
        timeoutMiddleware,
        loggerMiddleware
    ),
    batchedSubscribe(notify => notify())
)(createStore);

export default function configureStore(initialState) {
    return createStoreWithMiddleware(rootReducer, initialState);
}
