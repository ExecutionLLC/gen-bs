'use strict';

import config from '../../config'

import Urls from './Urls';
import SessionsClient from './SessionsClient';
import SamplesClient from './SamplesClient';

class ApiFacade {
    constructor() {
        var urls = new Urls(config.HOST, config.PORT);
        this._sessionsClient = new SessionsClient(urls);
        this._samplesClient = new SamplesClient(urls);
    }

    get sessionsClient() {
        return this._sessionsClient;
    }

    get samplesClient() {
        return this._samplesClient;
    }
}

const apiFacade = new ApiFacade();
export default apiFacade;
