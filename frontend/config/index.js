
const HOST = window.location.hostname;
const PORT = API_PORT;
console.log('API_PORT: ', API_PORT)

const config = {
  HOST: HOST,
  PORT: PORT,
  URLS: {
    WS: `ws://${HOST}:${PORT}`,
    SESSION: `http://${HOST}:${PORT}/api/session`,
    FIELDS: (sampleId) => `http://${HOST}:${PORT}/api/fields/${sampleId}`,
    USERDATA: `http://${HOST}:${PORT}/api/data`,
    SEARCH: `http://${HOST}:${PORT}/api/search`
  }
}

export default config

