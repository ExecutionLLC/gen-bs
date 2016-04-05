'use strict';

import config from '../../config';

import Urls from './Urls';
import DataClient from './DataClient';
import FiltersClient from './FiltersClient';
import SamplesClient from './SamplesClient';
import SearchClient from './SearchClient';
import SessionsClient from './SessionsClient';
import ViewsClient from './ViewsClient';

class ApiFacade {
    constructor() {
        var urls = new Urls(config.HOST, config.PORT);

        this._dataClient = new DataClient(urls);
        this._filtersClient = new FiltersClient(urls);
        this._samplesClient = new SamplesClient(urls);
        this._searchClient = new SearchClient(urls);
        this._sessionsClient = new SessionsClient(urls);
        this._viewsClient = new ViewsClient(urls);
    }

    get dataClient() {
        return this._dataClient;
    }

    get filtersClient() {
        return this._filtersClient;
    }

    get samplesClient() {
        return this._samplesClient;
    }

    get searchClient() {
        return this._searchClient;
    }
    
    get sessionsClient() {
        return this._sessionsClient;
    }

    get viewsClient() {
        return this._viewsClient;
    }
}

const apiFacade = new ApiFacade();
export default apiFacade;
