'use strict';

const Express = require('express');
const bodyParser = require('body-parser');
const Http = require('http');
const WebSocketServer = require('ws').Server;

const Config = require('./utils/Config');

const ControllersFacade = require('./controllers/ControllersFacade');
const ServicesFacade = require('./services/ServicesFacade');
const ModelsFacade = require('./models/ModelsFacade');

const models = new ModelsFacade(Config);
const StartupTaskManager = require('./startup/StartupTaskManager');

const services = new ServicesFacade(Config, models);
const controllers = new ControllersFacade(services);

// Create service
const httpServer = Http.createServer();
const app = new Express();

app.set('port', Config.port);

app.use(bodyParser.json());
app.use('/', Express.static('public'));

const mainRouter = controllers.apiController.createRouter(controllers);
app.use('/api', mainRouter);

// Initialize web socket server
const webSocketServer = new WebSocketServer({
  server: httpServer
});

const wsController = controllers.wsController;
wsController.addWebSocketServerCallbacks(webSocketServer);

httpServer.on('request', app);

httpServer.listen(app.get('port'), function() {
  const host = httpServer.address().address;
  const port = httpServer.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
