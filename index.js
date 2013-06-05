var server = require('./lib/server'),
    client = require('./lib/client');

module.exports = exports = function(cons, cb) {
    return server.handler(cons, cb);
}

exports.server = server;
exports.client = client;