var debug = require('debug')('ndo:client'),
    util = require('util'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    parseArgs = require('dnode/lib/parse_args'),
    net = require('net'),
    dnode = require('dnode'),
    midst = require('midst'),

    utils = require('./utils'),

    __slice = [].slice;

function Client(cons, m) {
    this.cons = cons;
    utils.merge(this, m || midst());

    this.connection = null;
    this.remote = null;
    this.queue = [];
}

util.inherits(Client, EventEmitter);

function _connect(client, cons) {

    if (client.closed || client.socket) return client;

    var pinger,
        alive,
        onend,
        socket,
        opts = parseArgs(__slice.call(arguments, 2)),

        cb = opts.block || function (remote, connection) {
            connection.emit('up', remote);
        },

        reconnect = (function (args) {
            return function () {
                client.emit('reconnect');
                _connect.apply(null, args);
            };
        })(arguments),

        d;

    if (opts.ping === undefined) opts.ping = 10000;
    if (opts.timeout === undefined) opts.timeout = 5000;
    if (opts.reconnect === undefined) opts.reconnect = 1000;
    if (opts.createStream === undefined) {
        opts.createStream = function () {
            return net.connect(opts.port, opts.host);
        }
    }

    d = dnode(function (remote, connection) {
        var res = cons || {};
        if (typeof cons === 'function') {
            res = cons.call(this, remote, connection);
            if (res === undefined) res = this;
        }

        if (!res) res = {};
        // middlewares
        client.handle({local: res, remote: remote, connection: connection});

        if (!res.ping) res.ping = function (cb) {
            if (typeof cb === 'function') cb();
        };

        return res;
    });

    d.once('up', function (r) {
        if (client.closed) return;
        client.remote = r;
        client.queue.forEach(function (fn) { fn(client.remote, client.connection) });
        client.queue = [];
        client.emit('up', client.remote, client.connection);
    });

    d.on('error', function(error) {
        client.emit('error', error);
    });

    d.on('remote', function (remote) {
        client.connection = d;
        if (opts.ping && typeof remote.ping !== 'function') {
            client.emit('error', new Error(
                'Remote does not implement ping. '
                    //+ 'Add server.use(require(\'upnode\').ping) to the remote.'
            ));
        }
        else if (opts.ping) {
            pinger = setInterval(function () {
                var t0 = Date.now();
                var to = opts.timeout && setTimeout(function () {
                    clearInterval(pinger);
                    if (client.connection) client.connection.end();
                    socket.destroy();
                }, opts.timeout);

                remote.ping(function () {
                    var elapsed = Date.now() - t0;
                    if (to) clearTimeout(to);
                    client.emit('ping', elapsed);
                });
            }, opts.ping);
        }
    });

    alive = true;
    onend = function () {
        var isUp = Boolean(client.connection);
        client.connection = null;
        client.remote = null;
        client.socket = null;
        socket.destroy();

        if (alive && !client.closed) setTimeout(reconnect, opts.reconnect);
        if (pinger) clearInterval(pinger);
        alive = false;
        if (isUp) client.emit('down');
    };
    pinger = null;

    d.on('remote', function (remote) {
        client.emit('remote', remote, d);
//        client.socket = socket;
        cb.call(this, remote, d);
    });
    socket = opts.createStream();
    d.socket = socket;
    client.socket = socket;
    socket.pipe(d).pipe(socket);

    socket.on('error', onend);
    socket.on('end', onend);
    socket.on('close', onend);

    d.on('error', onend);

    return client;
}

Client.prototype.connect = function() {
    var self = this,
        args = __slice.call(arguments);

    if (self.connection) {
        self.close(function() {
            _connect.apply(null, [self, self.cons].concat(args));
        });
    } else {
        if (!self.socket) self.closed = false;
        _connect.apply(null, [self, self.cons].concat(args));
    }

    return self;
};


Client.prototype.up = function (t, fn) {
    var self = this;

    if (typeof t === 'function') {
        fn = t;
        t = 0;
    }

    if (self.remote) {
        fn(self.remote, self.connection);
    } else if (t) {
        var f = function () {
            clearTimeout(to);
            fn.apply(null, arguments);
        };
        var to = setTimeout(function () {
            var ix = self.queue.indexOf(f);
            if (ix >= 0) self.queue.splice(ix, 1);
            fn();
        }, t);
        self.queue.push(f);
    }
    else self.queue.push(fn)
};

Client.prototype.close = function (cb) {
    var self = this;

    function onclose() {
        self.emit('close');
        if (cb) cb();
    }

    if (self.closed) {
        if (cb) cb();
        return self;
    }

    self.closed = true;
    if (self.connection) {
        self.connection.end();
        self.once('down', onclose);
    } else if (self.socket) {
        self.socket.once('close', onclose);
        self.socket.destroy();
    } else {
        onclose();
    }

    return self;
};

module.exports = exports = function (cons, m) {
    return new Client(cons, m);
};

exports.Client = Client;
