'use strict';

const Express = require('express');
const bodyParser = require('body-parser');

const Config = require('./utils/ConfigWrapper');
const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');

// Create service.
const app = new Express();

app.set('port', Config.port);

app.use(bodyParser.json());
app.use('/', Express.static('public'));

const services = new ServicesFacade(Config);
const controllers = new ControllersFacade(services);

app.use('/api/ws', controllers.wsController.createRouter());

const mainRouter = controllers.apiController.createRouter(controllers);
app.use('/api', mainRouter);

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
