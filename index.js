var server = require('./lib/server'),
    client = require('./lib/client'),
    channel = require('./lib/channel');

module.exports = exports = function create(cons) {
    var ro = {};
    ro.listen = function() {
        var s = server(cons);
        return s.listen.apply(s, arguments);
    }
    ro.connect = function() {
        var c = client(cons);
        return c.connect.apply(c, arguments);
    }
    return ro;
}

exports.server = server;
exports.client = client;

exports.listen = function() {
    return exports().listen.apply(null, arguments);
}

exports.connect = function() {
    return exports().connect.apply(null, arguments);
}

exports.handler = server.handler;
exports.channel = channel;