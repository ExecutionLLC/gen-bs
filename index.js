'use strict';
const Express = require('express');

const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');

const app = new Express();
app.set('port', process.env.PORT || 5000);
app.use('/', Express.static('public'));

const controllersFacade = new ControllersFacade();
const servicesFacade = new ServicesFacade();

app.use('/api/data', controllersFacade.userDataController.createRouter(controllersFacade.viewController, controllersFacade.filterController));
app.use('/api/filters', controllersFacade.filterController.createRouter());
app.use('/api/views', controllersFacade.viewController.createRouter());

app.use('/api/demo/data', controllersFacade.demoUserDataController.createRouter(controllersFacade.viewController, controllersFacade.filterController));
app.use('/api/demo/filters', controllersFacade.filterController.createRouter());
app.use('/api/demo/views', controllersFacade.viewController.createRouter());

app.use('/api/login', controllersFacade.loginController.createRouter());

app.use('/api/search', controllersFacade.searchController.createRouter());
app.use('/api/demo/search', controllersFacade.searchController.createRouter());

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});