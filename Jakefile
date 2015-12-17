var path = require('path');
var spawn = require('child_process').spawn;

var utils = require('./lib/utils');
utils.requireDir(path.join(__dirname, 'tasks'));

jake.addListener('complete', function() { process.exit(); });

desc("Пересоздание всех БД и сброс кэшей");
task('reset', [], function(params) {
    complete();
}, true);

task('default', ['reset', 'server'], function(params) {
    complete();
}, true);