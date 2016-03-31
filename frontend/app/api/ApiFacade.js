'use strict';

import config from '../../config'

import Urls from './Urls';
import SessionsClient from './SessionsClient';
import SavedFilesClient from './SavedFilesClient';

class ApiFacade {
    constructor() {
        var urls = new Urls(config.HOST, config.PORT);
        this._sessionsClient = new SessionsClient(urls);
        this._savedFilesClient = new SavedFilesClient(urls);
    }

    get sessionsClient() {
        return this._sessionsClient;
    }

    get savedFilesClient() {
        return this._savedFilesClient;
    }
}

const apiFacade = new ApiFacade();
export default apiFacade;
