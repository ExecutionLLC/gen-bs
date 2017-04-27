'use strict';

const Config = require('./utils/Config');
const Logger = require('./utils/Logger');

const ModelsFacade = require('./models/ModelsFacade');
const ServicesFacade = require('./services/ServicesFacade');
const ControllersFacade = require('./controllers/ControllersFacade');

const WebServerHost = require('./WebServerHost');

const Enums = require('./utils/Enums');
const PasswordUtils = require('./utils/PasswordUtils');

if (require.main === module) {
    const logger = new Logger(Config.logger);

    const models = new ModelsFacade(Config, logger);
    const services = new ServicesFacade(Config, logger, models);
    const controllers = new ControllersFacade(logger, services);

    const webServerHost = new WebServerHost(controllers, services, models);

    function setOnExitCallback() {

	process.on('exit', () => {
	    webServerHost.stop((error) => {
		logger.error(error);
	    })
	});

	process.on('uncaughtException', (error) => {
	    logger.error(error);
	    process.exit(99);
	});

	process.on('SIGINT', () => {
	    logger.info('Caught signal: SIGINT');
	    process.exit(2);
	});
    }

    setOnExitCallback();

    webServerHost.start((error) => {
	if (error) {
	    logger.error(error);
	    process.exit(1);
	}
    });
}

console.log('index.js as ' + (require.main === module ? 'main' : 'module'));

module.exports = {
    Enums,
    ModelsFacade,
    ServicesFacade,
    Config,
    Logger,
    PasswordUtils
};
