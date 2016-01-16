
//const SESSION_URL = 'http://ec2-52-91-166-29.compute-1.amazonaws.com:8080/api/session'
//const WS_URL = 'ws://ec2-52-91-166-29.compute-1.amazonaws.com:8080'

const HOST = window.location.hostname;
const PORT = 5000;

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

