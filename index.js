'use strict';

const Config = require('./utils/Config');
const Logger = require('./utils/Logger');

const ModelsFacade = require('./models/ModelsFacade');
const ServicesFacade = require('./services/ServicesFacade');
const ControllersFacade = require('./controllers/ControllersFacade');

const ServiceHost = require('./ServiceHost');

const logger = new Logger(Config.logger);

const models = new ModelsFacade(Config, logger);
const services = new ServicesFacade(Config, logger, models);
const controllers = new ControllersFacade(logger, services);

const serviceHost = new ServiceHost(controllers, services, models);
serviceHost.start((error) => {
    if (error) {
        logger.error(error);
        process.exit(1);
    }
});
