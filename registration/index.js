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

const dbModel = new KnexWrapper(Config, logger);
const registrationCodesModel = new RegistrationCodesModel(dbModel, logger);
const userRequestModel = new UserRequestModel(dbModel, logger);
const usersClient = new UsersClient(Config);

const registrationCodes = new RegistrationCodesService(dbModel, registrationCodesModel, usersClient);
const userRequests = new UserRequestService(dbModel, userRequestModel, usersClient);

const app = new Express();
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(Express.static('public'));
app.use(cors({
    origin: 'http://alapy.com',
    credentials: true
}));
app.use(helmet({
    noCache: true
}));


app.post('/register', (request, response) => {
    console.log('register');
    console.log(request.body.id);
    console.log(request.body);
    registrationCodes.activateAsync(request.body.id, request.body.firstName, request.body.lastName, request.email)
        .then(() =>
            response.send({})
        )
        .catch((error) =>
            response.status(400).send(error.message)
        );
});

function returnUser(user) {
    const {id, firstName, lastName, company, email, gender, isActivated, regcode, speciality, telephone} = user;
    return {id, firstName, lastName, company, email, gender, isActivated, regcode, speciality, telephone};
}

app.get(
    '/user',
    (request, response) => {
        console.log('/user', request.query);
        const {regcode, regcodeId} = request.query;
        const findAsync = regcodeId ?
            registrationCodes.findRegcodeIdAsync(regcodeId) :
            registrationCodes.findRegcodeAsync(regcode);

        findAsync
            .then((user) => {
                registrationCodes.updateFirstDate(user.id, user);
                return response.send(returnUser(user));
            })
            .catch((err) => response.status(404).send(err.message));
    }
);

app.put('/user', (request, response) => {
    console.log('update user');
    console.log(request.body);
    const regcodeInfo = request.body;
    registrationCodes.update(regcodeInfo.id, regcodeInfo)
        .then(() => {
            registrationCodes.updateLastDate(regcodeInfo.id, regcodeInfo);
            return response.send(returnUser(regcodeInfo));
        })
        .catch((err) => response.status(400).send(err.message));
});

app.post('/user_request', (request, response) => {
    console.log('user request');
    console.log(request.body);
    const userInfo = request.body;
    userRequests.createAsync(userInfo)
        .then(() =>
            response.send(returnUser(userInfo))
        )
        .catch((err) => response.status(400).send(err.message));
});

app.get('/register', (request, response) => {
    response.send('Got hello!');
});

app.listen(3000, () => {
    console.log('Server is started!');
});
