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

app.post('/get_user_for_regcode_email', (request, response) => {
    console.log('get_user_for_regcode_email');
    console.log(request.body);
    const {regcode, email} = request.body;
    userInfo.findByRegcodeOrEmailAsync(regcode, email)
        .then((user) => response.send(user))
        .catch((err) => response.send(null));
});

app.post('/create_user', (request, response) => {
    console.log('create_user');
    console.log(request.body);
    const {regcode, email, user} = request.body;
    userInfo.create(Object.assign({}, user, {regcode, email}))
        .then((user) => response.send(user))
        .catch((err) => response.send(null));
});

app.post('/update_user', (request, response) => {
    console.log('update_user');
    console.log(request.body);
    const user = request.body;
    userInfo.update(user.id, user)
        .then((userId) => response.send(user))
        .catch((err) => response.send(null));
});

app.get('/register', (request, response) => {
    response.send('Got hello!');
});

app.listen(3000, () => {
    console.log('Server is started!');
});
