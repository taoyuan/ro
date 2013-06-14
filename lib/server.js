var debug = require('debug')('ndo:server'),
    util = require('util'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    parseArgs = require('dnode/lib/parse_args'),
    net = require('net'),
    tls = require('tls'),
    midst = require('midst'),

    connection = require('./connection'),
    utils = require('./utils');

function Server(cons, m) {
    this.cons = cons;
    utils.merge(this, m || midst());

    this.connections = [];
}

util.inherits(Server, EventEmitter);

Server.prototype.listen = function () {
    var self = this,
        cons = self.cons,
        args = parseArgs(arguments);

    if (self._server && !self._server._closed) {
        self.close(function () {
            self.listen.call(self, args);
        });
    }

    var _handler = handler(
        // cons
        function (remote, connection) {
            var res = cons || {};
            if (typeof cons === 'function') {
                res = cons.call(this, remote, connection);
                if (res === undefined) res = this;
            }

            if (!res) res = {};
            // middlewares
            self.handle({local: res, remote: remote, connection: connection});

            return res;
        },
        // onconnect callback
        function (c) {

            if (!self.connections) self.connections = [];
            self.connections.push(c);
            c.once('disconnect', function () {
                var idx = self.connections.indexOf(c);
                if (idx >= 0) self.connections.splice(idx, 1);
                self.emit('disconnect', c);
            });
            c.once('remote', function (remote) {
                self.emit('connect', remote, c);
            });
        }
    );

    var server = args.ssl ? tls.createServer(args.ssl, _handler) : net.createServer(_handler);

    if (args.port) {
        server.listen(args.port, args.host, args.block);
    }
    else if (args.path) {
        server.listen(args.path, args.block);
    }
    else throw new Error("no port or path given to .listen()");

    self._server = server;

    // Add end function for the server to end all of connections (and end all of connections).
    if (!server.end) server.end = function () {
        (self.connections || []).forEach(function (c) {
            c.destroy();
        });
    };

    var _close = server.close.bind(server);
    server.close = function (cb) {
        if (!this._closed) _close(cb);
        this._closed = true;
    };

    server.on('close', function () {
        self.alive = false;
        self.emit('close');
    });

    server.on('error', function (err) {
        self.emit('error', err)
    });

    process.nextTick(function () {
        self.alive = true;
        self.emit('ready');
    });

    return this;
};

Server.prototype.close = function (callback) {
    if (typeof callback !== 'function') callback = function () {
    };
    var self = this;


    if (!self._server || self._server._closed) {  // has not called listen or has been closed
        callback();
        return self;
    } else if (!self.alive) {      // has called listener but not ready. it means called listener and immediately call close.
        self.once('ready', function () {
            self.close(callback)
        });
        return self;
    }

    self._server.end();
    self._server.close(function () {
        callback();
    });
    return self;
};

function handler(cons, onconnect) {
    return function (socket) {
        debug('client connected %s:%s', socket.remoteAddress, socket.remotePort);

        var c = connection(cons);

        c.socket = socket;
        c.pipe(socket).pipe(c);

        if (typeof onconnect === 'function') onconnect(c, socket);
    }
}

module.exports = exports = function (cons, m) {
    return new Server(cons, m);
};

exports.Server = Server;
exports.handler = handler;