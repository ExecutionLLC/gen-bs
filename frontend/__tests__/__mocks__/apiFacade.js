class MockApiFacade {
    constructor() {
        const properties = [
            'dataClient',
            'commentsClient',
            'filtersClient',
            'queryHistoryClient',
            'samplesClient',
            'searchClient',
            'sessionsClient',
            'savedFilesClient',
            'viewsClient'
        ].forEach(propName => {
            Object.defineProperty(this, propName, {
                enumerable: false,
                configurable: false,
                writeable: false,
                get: () => ({})
            });
        });
    }
}

const apiFacade = new MockApiFacade();
export default apiFacade;
