'use strict';

const Express = require('express');
const bodyParser = require('body-parser');

const Config = require('./utils/Config');
const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');
const ModelsFacade = require('./models/ModelsFacade');

const models = new ModelsFacade();
const services = new ServicesFacade(Config, models);
const controllers = new ControllersFacade(services);

// Create service.
const app = new Express();

app.set('port', Config.port);

app.use(bodyParser.json());
app.use('/', Express.static('public'));

app.use('/api/ws', controllers.wsController.createRouter());

const mainRouter = controllers.apiController.createRouter(controllers);
app.use('/api', mainRouter);

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
