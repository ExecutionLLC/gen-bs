
//const HOST = window.location.hostname;
const HOST = API_HOST
const PORT = API_PORT;
console.log('API_PORT: ', API_PORT)

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
    VIEWS: `http://${HOST}:${PORT}/api/views`,
    FILTERS: `http://${HOST}:${PORT}/api/filters`
  }
}

export default config

