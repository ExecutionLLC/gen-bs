var express = require('express'),
    multer  = require('multer'),
    fs = require('fs'),
    cors = require('cors'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    compression = require('compression')
    ;
var upload = multer({ dest: 'uploads/' });

var app = express();

app.disable('x-powered-by');
app.use(bodyParser.json());
app.use(morgan('combined'));
app.use(compression());

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use('/', express.static('.'));

app.post('/', upload.single('file'), function(req, res) {
    const {body, file} = req;
    console.log(body); // form fields
    console.log(file); // form files
    //fs.unlinkSync(`${__dirname}/${file.path}`);
    res.status(204).end();
});

app.listen(3000, () => {
    console.log('Server ready.');
});