'use strict';
const Express = require('express');

const UserController = require('./controllers/UserController');
const ViewController = require('./controllers/ViewController');
const ServiceFacade = require('./services/ServicesFacade');

const app = new Express();
app.set('port', process.env.PORT || 5000);
app.use('/', Express.static('public'));

const services = new ServiceFacade();

const userController = new UserController(services);
const viewController = new ViewController(services);

app.use('/users', userController.createRouter(viewController));

const server = app.listen(app.get('port'), function() {
  const host = server.address().address;
  const port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
