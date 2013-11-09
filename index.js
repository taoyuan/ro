var _ = require('lodash'),
    midst = require('midst'),
    Server = require('./lib/server'),
    Client = require('./lib/client'),
    connection = require('./lib/connection');

module.exports = exports = function create(cons) {
    var app = {},
        m = midst();
    app.listen = function () {
        var s = new Server(cons, m);
        return s.listen.apply(s, arguments);
    };
    app.connect = function () {
        var c = new Client(cons, m);
        return c.connect.apply(c, arguments);
    };
    _.extend(app, m);
    return app;
};

exports.server = exports.Server = Server;
exports.client = exports.Client = Client;

exports.listen = function () {
    return exports().listen.apply(null, arguments);
};

exports.connect = function () {
    return exports().connect.apply(null, arguments);
};

exports.handler = Server.handler;
exports.connection = connection;