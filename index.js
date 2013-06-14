var midst = require('midst'),
    server = require('./lib/server'),
    client = require('./lib/client'),
    connection = require('./lib/connection'),
    utils = require('./lib/utils');

module.exports = exports = function create(cons) {
    var app = {},
        m = midst();
    app.listen = function () {
        var s = server(cons, m);
        return s.listen.apply(s, arguments);
    };
    app.connect = function () {
        var c = client(cons, m);
        return c.connect.apply(c, arguments);
    };
    utils.merge(app, m);
    return app;
};

exports.server = server;
exports.client = client;

exports.listen = function () {
    return exports().listen.apply(null, arguments);
};

exports.connect = function () {
    return exports().connect.apply(null, arguments);
};

exports.handler = server.handler;
exports.connection = connection;