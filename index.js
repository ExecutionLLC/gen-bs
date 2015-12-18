'use strict';

const Express = require('express');
const bodyParser = require('body-parser');

const ConfigWrapper = require('./utils/ConfigWrapper');
const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');

const app = new Express();

const config = new ConfigWrapper();

app.set('port', config.settings.port);

app.use(bodyParser.json());
app.use('/', Express.static('public'));

const services = new ServicesFacade(config);
const controllers = new ControllersFacade(services);

app.use('/api/ws', controllers.wsController.createRouter());

const mainRouter = controllers.apiController.createRouter(controllers);
app.use('/api', mrpcainRouter);

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
