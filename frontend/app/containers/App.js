
import { createStore } from 'redux'
import genApp from '../reducers'

import '../components/Header/ExportButtons'

const store = createStore(genApp);
export default store;
