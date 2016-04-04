'use strict';

import config from '../../config'

import Urls from './Urls';
import SessionsClient from './SessionsClient';
import QueryHistoryClient from './QueryHistoryClient';

class ApiFacade {
    constructor() {
        var urls = new Urls(config.HOST, config.PORT);
        this._sessionsClient = new SessionsClient(urls);
        this._queryHistoryClient = new QueryHistoryClient(urls);
    }

    get sessionsClient() {
        return this._sessionsClient;
    }
    
    get queryHistoryClient() {
        return this._queryHistoryClient;
    }
}

const apiFacade = new ApiFacade();
export default apiFacade;
