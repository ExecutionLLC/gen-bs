const Express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const Config = require('./Config');
const Logger = require('./utils/Logger');
const logger = new Logger(Config.logger);

const KnexWrapper = require('./utils/KnexWrapper');
const RegistrationCodesService = require('./services/RegistrationCodesService');
const RegistrationCodesModel = require('./models/RegistrationCodesModel');
const UsersClient = require('./api/UsersClient');
const UserInfoModel = require('./models/UserInfoModel');
const UserInfoService = require('./services/UserInfoService');

const dbModel = new KnexWrapper(Config, logger);
const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
const userInfoModel = new UserInfoModel(dbModel, logger);
const usersClient = new UsersClient(Config);

const registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel, usersClient);
const userInfo = new UserInfoService(dbModel, userInfoModel);

const app = new Express();
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(Express.static('public'));

app.post('/register', (request, response) => {
    console.log('register');
    console.log(request.body.id);
    console.log(request.body);
    registrationCodes.activateAsync()
        .then(() =>
            response.send({success: true})
        )
        .catch((error) =>
            response.send({success: false, error})
        );
});

app.get(
    '/user',
    (request, response) => {
        console.log('/user', request.query);
        const {regcode, regcodeId} = request.query;
        if (regcodeId) {
            registrationCodes.findRegcodeIdAsync(regcodeId)
                .then((user) => response.send(user))
                .catch((err) => response.status(404).send(err.message));
        } else {
            registrationCodes.findRegcodeAsync(regcode)
                .then((user) => response.send(user))
                .catch((err) => response.status(404).send(err.message));
        }
    }
);
/*
app.post('/user', (request, response) => {
    console.log('create user');
    console.log(request.body);
    const {regcode, email, user} = request.body;
    userInfo.create(Object.assign({}, user, {regcode, email}))
        .then((user) => response.send(user))
        .catch((err) => response.status(400).send(err.message));
});
*/
app.put('/user', (request, response) => {
    console.log('update user');
    console.log(request.body);
    const regcodeInfo = request.body;
    registrationCodes.update(regcodeInfo.id, regcodeInfo)
        .then((userId) => response.send(regcodeInfo))
        .catch((err) => response.status(400).send(err.message));
});

app.get('/register', (request, response) => {
    response.send('Got hello!');
});

app.listen(3000, () => {
    console.log('Server is started!');
});
