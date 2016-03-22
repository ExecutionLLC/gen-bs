//const HOST = window.location.hostname;
const HOST = API_HOST;
const PORT = API_PORT;
console.log(`Using API ${HOST}:${PORT}`);

const config = {
    HOST: HOST,
    PORT: PORT,
    URLS: {
        WS: `ws://${HOST}:${PORT}`,
        SESSION: `http://${HOST}:${PORT}/api/session`,
        FIELDS: (sampleId) => `http://${HOST}:${PORT}/api/fields/${sampleId}`,
        SOURCE_FIELDS: `http://${HOST}:${PORT}/api/fields/sources`,
        USERDATA: `http://${HOST}:${PORT}/api/data`,
        SEARCH: `http://${HOST}:${PORT}/api/search`,
        SEARCH_IN_RESULTS: (operationId) => `http://${HOST}:${PORT}/api/search/${operationId}`,
        VIEWS: `http://${HOST}:${PORT}/api/views`,
        FILTERS: `http://${HOST}:${PORT}/api/filters`,
        SAMPLES: `http://${HOST}:${PORT}/api/samples`,
        FILE_UPLOAD: `http://${HOST}:${PORT}/api/samples/upload`,
        COMMENTS:`http://${HOST}:${PORT}/api/comments`
    }
};

export default config

