const Express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const Config = require('./Config');
const Logger = require('./utils/Logger');
const logger = new Logger(Config.logger);

const KnexWrapper = require('./utils/KnexWrapper');
const RegistrationCodesService = require('./services/RegistrationCodesService');
const RegistrationCodesModel = require('./models/RegistrationCodesModel');
const UserRequestService = require('./services/UserRequestService');
const UserRequestModel = require('./models/UserRequestModel');
const UsersClient = require('./api/UsersClient');
const ReCaptchaClient = require('./api/ReCaptchaClient');
const MailChimpMailService = require('./services/external/MailChimpMailService');
const PasswordUtils = require('./utils/PasswordUtils');

const dbModel = new KnexWrapper(Config, logger);
const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
const userRequestModel = new UserRequestModel(dbModel, logger);
const usersClient = new UsersClient(Config);
const reCaptchaClient =  new ReCaptchaClient(Config);

const registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel, usersClient);
const userRequests = new UserRequestService(dbModel, userRequestModel, usersClient);

const mailService = new MailChimpMailService(Config);

const app = new Express();
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(Express.static('public'));
app.use(cors({
    origin: '*', // must be 'Config.registrationFrontend.site', but did not work at some case
    credentials: true
}));
app.use(helmet({
    noCache: true
}));


app.post('/register', (request, response) => {
    logger.info('register');
    if (!request.body.user) {
        response.status(400).send('No request user');
        return;
    }
    const {reCaptchaResponse, user: {id, firstName, lastName, company, email, gender, speciality, telephone, loginType, password}} = request.body;
    const user = {id, firstName, lastName, company, email, gender, speciality, telephone, loginType, password: password && PasswordUtils.hash(password)};
    logger.info(reCaptchaResponse, user);
    reCaptchaClient.checkAsync(reCaptchaResponse)
        .then((res) => {
            logger.info('/register recaptcha result', res);
            registrationCodes.activateAsync(user)
                .then(() => mailService.sendRegisterCodeMailAsync(user.email, user))
                .then(() => response.send({}))
                .catch((error) =>
                    response.status(400).send(error.message)
                );
        })
        .catch((err) => {
            logger.info('/register recaptcha error', err);
            return response.status(400).send(err);
        });
});

function filterUser(user) {
    const {id, firstName, lastName, company, email, gender, isActivated, regcode, speciality, telephone} = user;
    return {id, firstName, lastName, company, email, gender, isActivated, regcode, speciality, telephone};
}

app.get(
    '/user',
    (request, response) => {
        logger.info('/user', request.query);
        const {regcode, regcodeId} = request.query;
        logger.info(regcode, regcodeId);
        const findAsync = regcodeId ?
            registrationCodes.findRegcodeIdAsync(regcodeId) :
            registrationCodes.findRegcodeAsync(regcode);

        findAsync
            .then((user) => {
                registrationCodes.updateFirstDate(user.id, user);
                return response.send(filterUser(user));
            })
            .catch((err) => response.status(404).send(err.message));
    }
);

app.put('/user', (request, response) => {
    logger.info('update user');
    const {id, firstName, lastName, company, email, gender, speciality, telephone} = request.body;
    const regcodeInfo = {id, firstName, lastName, company, email, gender, speciality, telephone};
    logger.info(regcodeInfo);
    registrationCodes.update(regcodeInfo.id, regcodeInfo)
        .then(() => {
            registrationCodes.updateLastDate(regcodeInfo.id, regcodeInfo);
            return response.send(filterUser(regcodeInfo));
        })
        .catch((err) => response.status(400).send(err.message));
});

app.post('/user_request', (request, response) => {
    logger.info('user request');
    if (!request.body.user) {
        response.status(400).send('No request user');
        return;
    }
    const {reCaptchaResponse, user: {id, firstName, lastName, company, email, gender, speciality, telephone, loginType, password}} = request.body;
    const userInfo = {id, firstName, lastName, company, email, gender, speciality, telephone, loginType, password: password && PasswordUtils.hash(password)};
    logger.info(reCaptchaResponse, userInfo);

    reCaptchaClient.checkAsync(reCaptchaResponse)
        .then((res) => {
            logger.info('/user_request recaptcha result');
            logger.info(JSON.stringify(res));
            if (!res || !res.success) {
                throw new Error('reCaptcha check fails')
            }
            return userRequests.createAsync(userInfo)
                .then((insertedUser) =>
                    mailService.sendRegisterMailAsync(userInfo.email, Object.assign({}, userInfo, {confirmUrl: `${Config.baseUrl}/confirm/?id=${insertedUser.emailConfirmUuid}`}))
                        .then(() => userRequests.emailConfirmSentAsync(insertedUser.id)))
                .then(() => response.send(userInfo))
                .catch((err) => response.status(400).send(err.message));
        })
        .catch((err) => {
            logger.info('/user_request recaptcha error');
            logger.info(JSON.stringify(err.message));
            return response.status(400).send(err.message);
        });
});

app.get('/approve', (request, response) => {
    logger.info('approve');
    const {id} = request.query;
    logger.info(id);
    userRequests.activateAsync(id)
        .then((user) => mailService.sendRegisterApproveMailAsync(user.email, user))
        .then(() => response.send({}))
        .catch((error) =>
            response.status(400).send(error.message)
        );
});

app.get('/confirm', (request, response) => {
    logger.info('confirm');
    const {id: confirmUUID} = request.query;
    logger.info(confirmUUID);
    userRequests.emailConfirmReceivedAsync(confirmUUID)
        .then((requestInfo) => {
            return userRequests.activateAsync(requestInfo.id)
                .then((user) => mailService.sendRegisterApproveMailAsync(user.email, user))
        })
        .then(() =>
            response.redirect(301, `${Config.registrationFrontend.site}${Config.registrationFrontend.emailConfirmedPath}`)
    );
});

app.get('/requests', (request, response) => {
    const {key} = request.query;
    if (key !== Config.adminDataKey) {
        response.send({});
        return;
    }
    userRequests.getAllRequestsAsync()
        .then((data) => response.send(data))
        .catch((error) => response.status(400).send(error.message));
});

app.get('/regcodes', (request, response) => {
    const {key} = request.query;
    if (key !== Config.adminDataKey) {
        response.send({});
        return;
    }
    registrationCodes.getAllRegcodesAsync()
        .then((data) => response.send(data))
        .catch((error) => response.status(400).send(error.message));
});

app.listen(Config.port, () => {
    logger.info('Server is started!');
});
