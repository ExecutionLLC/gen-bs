'use strict';

import config from '../../config'

import Urls from './Urls';
import SessionsClient from './SessionsClient';

class ApiFacade {
    constructor() {
        var urls = new Urls(config.HOST, config.PORT);
        this._sessionsClient = new SessionsClient(urls);
    }

    get sessionsClient() {
        return this._sessionsClient;
    }
}

const apiFacade = new ApiFacade();
export default apiFacade;
