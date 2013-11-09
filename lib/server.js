var debug = require('debug2')('ro:server'),
    util = require('util'),
    utils = require('./utils'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    parseArgs = require('dnode/lib/parse_args'),
    net = require('net'),
    tls = require('tls'),

    connection = require('./connection');

function Server(cons) {
    if (!(this instanceof Server)) {
        return new Server(cons);
    }
    this.cons = cons;
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
                if (!res) res = this;
            }

            if (!res) res = {};
            // middlewares
//            self.handle({local: res, remote: remote, connection: connection});

            return res;
        },
        // onconnect callback
        function (c) {

            if (!self.connections) self.connections = [];
            self.connections.push(c);
            c.once('disconnect', function () {
                debug('disconnect');
                var idx = self.connections.indexOf(c);
                if (idx >= 0) self.connections.splice(idx, 1);
                self.emit('disconnect', c);
            });
            c.once('remote', function (remote) {
                self.emit('connect', remote, c);
            });
        }
    );

    var server = args.ssl ? tls.createServer(utils.parseSSLOptions(args.ssl), _handler) : net.createServer(_handler);

    if (args.port) {
        server.listen(args.port, args.host, args.block);
    } else if (args.path) {
        server.listen(args.path, args.block);
    } else {
        throw new Error("no port or path given to .listen()");
    }

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
//        self.ready = false;
        self.emit('close');
    });

    server.on('error', function (err) {
        self.emit('error', err)
    });

//    process.nextTick(function () {
//        self.ready = true;
//        self.emit('ready');
//    });

    return this;
};

Server.prototype.close = function (callback) {
    debug('closing');
    if (typeof callback !== 'function') callback = function () {
    };
    var self = this;


    if (!self._server || self._server._closed) {  // has not called listen or has been closed
        debug('has been closed, just invoke callback');
        callback();
        return self;
    }
//    else if (!self.ready) {      // has called listener but not ready. it means called listener and immediately call close.
//        debug('activated but not ready, listen "ready" event');
//        self.once('ready', function () {
//            debug('ready to close');
//            self.close(callback)
//        });
//        return self;
//    }

    self._server.once('close', function () {
        debug('closed and invoke callback');
        callback();
    });

    debug('ending server');
    self._server.end();
    self._server.close();
    return self;
};

Server.handler = handler;
function handler(cons, onconnect) {
    return function (socket) {
        debug('client connected %s:%s', socket.remoteAddress, socket.remotePort);

        var c = connection(cons);

        c.socket = socket;
        c.pipe(socket).pipe(c);

        if (typeof onconnect === 'function') onconnect(c, socket);
    }
}

module.exports = Server;