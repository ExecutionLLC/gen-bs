var express = require('express');

var app = express();
app.set('port', process.env.PORT || 3456);
app.use('/', express.static('public'));

var server = app.listen(app.get('port'), function() {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Welcome to Genomix WebServer! The server is started on http://%s:%s', host, port);
});
