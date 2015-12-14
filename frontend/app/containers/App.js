
import { createStore } from 'redux'
import genApp from '../reducers'

const store = createStore(genApp);
export default store;
