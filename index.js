'use strict';

const Express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const Http = require('http');
const WebSocketServer = require('ws').Server;

const Config = require('./utils/Config');
const Logger = require('./utils/Logger');

const ModelsFacade = require('./models/ModelsFacade');
const ServicesFacade = require('./services/ServicesFacade');
const ControllersFacade = require('./controllers/ControllersFacade');

const StartupTaskManager = require('./startup/StartupTaskManager');

const logger = new Logger(Config.logger);

const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);
const controllers = new ControllersFacade(logger, services);

// Create service
const httpServer = Http.createServer();
const app = new Express();

logger.info('Server config:');
logger.info(Config);

if (Config.enableCORS) {
  logger.error('Cross-origin resource sharing enabled!');
  app.use(cors());
}

if (Config.allowMultipleUserSessions) {
  logger.error('Multiple user sessions enabled!');
}

app.set('port', Config.port);

app.use(bodyParser.json());

app.use(morgan('combined'));

app.use('/', Express.static('public'));

const mainRouterRelativePath = '/api';
const mainRouter = controllers.apiController.createRouter(controllers, mainRouterRelativePath);
app.use(mainRouterRelativePath, mainRouter);

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

  logger.info('Welcome to Genomix WebServer! The server is started on http://' + host + ':' + port);
});
