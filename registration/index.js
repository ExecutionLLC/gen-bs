const Express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = new Express();
app.disable('x-powered-by');
app.use(compression());
app.use(bodyParser.json());
app.use(morgan('combined'));

app.post('/register', (request, response) => {
    response.send('Hello world!');
});

app.get('/register', (request, response) => {
    response.send('Got hello!');
});

app.listen(3000, () => {
    console.log('Server is started!');
});
