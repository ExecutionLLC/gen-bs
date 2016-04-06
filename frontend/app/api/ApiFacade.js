'use strict';

import config from '../../config';

import Urls from './Urls';
import CommentsClient from './CommentsClient';
import DataClient from './DataClient';
import FiltersClient from './FiltersClient';
import SamplesClient from './SamplesClient';
import SearchClient from './SearchClient';
import SessionsClient from './SessionsClient';
import ViewsClient from './ViewsClient';
import SavedFilesClient from './SavedFilesClient';

class ApiFacade {
    constructor() {
        var urls = new Urls(config.HOST, config.PORT);

        this._dataClient = new DataClient(urls);
        this._commentsClient = new CommentsClient(urls);
        this._filtersClient = new FiltersClient(urls);
        this._samplesClient = new SamplesClient(urls);
        this._searchClient = new SearchClient(urls);
        this._sessionsClient = new SessionsClient(urls);
        this._savedFilesClient = new SavedFilesClient(urls);
        this._viewsClient = new ViewsClient(urls);
    }

    get dataClient() {
        return this._dataClient;
    }

    get commentsClient() {
        return this._commentsClient;
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

    get savedFilesClient() {
        return this._savedFilesClient;
    }

    get viewsClient() {
        return this._viewsClient;
    }
}

const apiFacade = new ApiFacade();
export default apiFacade;
