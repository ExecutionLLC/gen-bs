'use strict';
const Express = require('express');

const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');

const app = new Express();
app.set('port', process.env.PORT || 5000);
app.use('/', Express.static('public'));

const services = new ServicesFacade();
const controllers = new ControllersFacade(services);

const mainRouter = controllers.apiController.createRouter(controllers);
app.use('/api', mainRouter);

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
