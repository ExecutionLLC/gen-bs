var _ = require('lodash');

var fs = require('fs');
var path = require('path');

var requireDir = exports.requireDir = function(root, opts, handler) {
    opts = _.defaults(opts || {}, {
        recursive: true,
        nested: false,
        exclude: [],
        exts: ['.js', '.json']
    });

    if (!handler) {
        handler = function(file) { return require(file); };
    }

    var combine = function(dir) {
        return fs.readdirSync(dir).reduce(function(result, fileName) {
            if (opts.exclude.indexOf(fileName) >= 0) {
                return result;
            }
            var file = path.join(dir, fileName);
            var ext = path.extname(fileName);

            if (opts.recursive && fs.statSync(file).isDirectory()) {
                if (opts.nested) {
                    result[fileName] = combine(file);
                } else {
                    _.extend(result, combine(file));
                }
            } else if (opts.exts.indexOf(ext) >= 0 && fileName !== 'index.js' ) {
                result[path.basename(file, ext)] = handler(file);
            }
            return result;
        }, {});
    };

    return combine(path.resolve(root));
};