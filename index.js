var express = require('express');

var app = express();
app.use('/', express.static('public'));

var server = app.listen(3456, function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
