var debug = require('debug')('ndo:server'),
    util = require('util'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    midst = require('midst'),
    parseArgs = require('dnode/lib/parse_args'),
    net = require('net'),
    tls = require('tls'),

    channel = require('./channel'),
    utils = require('./utils');


module.exports = exports = function (cons, opts) {
    return new Server(cons, opts);
};

function Server(cons, opts) {
    this.cons = cons;
    this.opts = opts || {};
    this.channels = [];
    utils.merge(this, midst.proto);
}

util.inherits(Server, EventEmitter);

Server.prototype.listen = function () {
    var self = this,
        args = parseArgs(arguments),
        ssl = self.opts['ssl'];

    if (self._server && !self._server._closed) {
        self.close(function () {
            self.listen.call(self, args);
        });
    }

    var server = ssl ? tls.createServer(ssl, handler(self)) : net.createServer(handler(self));

    if (args.port) {
        server.listen(args.port, args.host, args.block);
    }
    else if (args.path) {
        server.listen(args.path, args.block);
    }
    else throw new Error("no port or path given to .listen()");

    self._server = server;

    // Add end function for the server to end all of channels (and end all of channels).
    if (!server.end) server.end = function () {
        (self.channels || []).forEach(function (c) {
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

function handler(app, cons) {
    return function (stream) {
        debug('client connected %s:%s', stream.remoteAddress, stream.remotePort);

        var c = channel(cons || app.cons || {});

        c.stream = stream;
        c.pipe(stream).pipe(c);

        if (app.handle) {
            c.on('local', function(local, channel) {
                app.handle(local, channel, function(err) {
                    if (err) throw new Error(err);
                });
            });
        }

        if (!app.channels) app.channels = [];
        app.channels.push(c);
        c.once('done', function () {
            var idx = app.channels.indexOf(c);
            if (idx >= 0) app.channels.splice(idx, 1);
            app.emit('disconnect', c);
        });
        c.once('remote', function (remote) {
            app.emit('connect', remote, c);
        });
    }
}