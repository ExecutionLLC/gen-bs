'use strict';
const Express = require('express');

const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');

const app = new Express();
app.set('port', process.env.PORT || 5000);
app.use('/', Express.static('public'));

const services = new ServicesFacade();
const controllers = new ControllersFacade(services);

app.use('/api/data', controllers.userDataController.createRouter(controllers.viewController, controllers.filterController));
app.use('/api/filters', controllers.filterController.createRouter());
app.use('/api/views', controllers.viewController.createRouter());

app.use('/api/demo/data', controllers.demoUserDataController.createRouter(controllers.viewController, controllers.filterController));

app.use('/api/login', controllers.loginController.createRouter());

app.use('/api/search', controllers.searchController.createRouter());
app.use('/api/demo/',
    controllers.demoUserDataController.createRouter(
        controllers.viewController, controllers.filterController));


const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
