'use strict';

const Express = require('express');
const ConfigWrapper = require('./utils/ConfigWrapper');

const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');

const app = new Express();
const config = new ConfigWrapper();

app.set('port', config.settings.port);
app.use('/', Express.static('public'));

const services = new ServicesFacade(config);
const controllers = new ControllersFacade(services);

app.use('/api/data', controllers.userDataController.createRouter(controllers.viewController, controllers.filterController));
app.use('/api/filters', controllers.filterController.createRouter());
app.use('/api/views', controllers.viewController.createRouter());

app.use('/api/demo/data', controllers.demoUserDataController.createRouter(
    controllers.viewController, controllers.filterController));

app.use('/api/login', controllers.loginController.createRouter());
app.use('/api/search', controllers.searchController.createRouter());

app.use('/api/ws', controllers.wsController.createRouter());

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
