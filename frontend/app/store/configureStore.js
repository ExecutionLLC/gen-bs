import { createStore, applyMiddleware } from 'redux'
import { reduxTimeout } from 'redux-timeout'
import thunkMiddleware from 'redux-thunk'
import createLogger from 'redux-logger'
import rootReducer from '../reducers'

const loggerMiddleware = createLogger();

const createStoreWithMiddleware = applyMiddleware(
    reduxTimeout(),
    thunkMiddleware,
    loggerMiddleware
)(createStore);

export default function configureStore(initialState) {
    return createStoreWithMiddleware(rootReducer, initialState)
}
