var express = require('express'),
    multer  = require('multer'),
    fs = require('fs'),
    cors = require('cors')
    ;
var upload = multer({ dest: 'uploads/' });

var app = express();

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

app.listen(3000);