var debug = require('debug2')('ro:client'),
    _ = require('lodash'),
    util = require('util'),
    EventEmitter = require('eventemitter2').EventEmitter2,
    parseArgs = require('dnode/lib/parse_args'),
    net = require('net'),
    dnode = require('dnode'),
    midst = require('midst'),
    __slice = [].slice;

function Client(cons, m) {
    this.cons = cons;
    _.extend(this, m || midst());

    this.connection = null;
    this.remote = null;
    this.queue = [];
}

util.inherits(Client, EventEmitter);

function doConnect(client, cons) {

    if (client.closed || client.socket) return client;

    var pinger,
        alive,
        socket,
        d;

    var opts = parseArgs(__slice.call(arguments, 2));
    _.defaults(opts, {
        ping: 10000,
        timeout: 5000,
        reconnect: 1000,
        createStream: function () {
            return net.connect(opts.port, opts.host);
        }
    });

    var cb = opts.block || function (remote, connection) {
        connection.emit('up', remote);
    };

    var reconnect = (function (args) {
        return function () {
            client.emit('reconnect');
            doConnect.apply(null, args);
        };
    })(arguments);

    d = dnode(function (remote, connection) {
        var res = cons || {};
        if (typeof cons === 'function') {
            res = cons.call(this, remote, connection);
            if (!res) res = this;
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
        client.queue.forEach(function (fn) {
            fn(client.remote, client.connection)
        });
        client.queue = [];
        client.emit('up', client.remote, client.connection);
    });

    d.on('error', function (error) {
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
    function onerror(err) {
        console.error(err);
        onend();
    }
    function onend() {
        debug('onend');
        var isUp = !!client.connection;
        client.connection = null;
        client.remote = null;
        client.socket = null;
        socket.destroy();

        if (alive && !client.closed) setTimeout(reconnect, opts.reconnect);
        if (pinger) clearInterval(pinger);
        alive = false;
        if (isUp) client.emit('down');
    }
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

    socket.on('error', onerror);
    socket.on('end', onend);
    socket.on('close', onend);

    d.on('error', onerror);

    return client;
}

Client.prototype.connect = function () {
    var self = this,
        args = __slice.call(arguments);

    if (self.connection) {
        self.close(function () {
            doConnect.apply(null, [self, self.cons].concat(args));
        });
    } else {
        if (!self.socket) self.closed = false;
        doConnect.apply(null, [self, self.cons].concat(args));
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
    debug('closing');
    var self = this;

    function onclose() {
        debug('on close invoked. emit close event and invoke callback');
        self.emit('close');
        if (cb) cb();
    }

    if (self.closed) {
        debug('has been closed, just invoke callback');
        if (cb) cb();
        return self;
    }

    self.closed = true;
    if (self.connection) { // close when connected
        debug('ending connection and listen "down" event');
        self.once('down', onclose);
        self.connection.destroy();
    } else if (self.socket) { // close immediately after connect
        debug('ending socket and listen "close" event');
        self.socket.once('close', onclose);
        self.socket.destroy();
    } else { // close without calling connect before
        onclose();
    }

    return self;
};

module.exports = exports = function (cons, m) {
    return new Client(cons, m);
};

exports.Client = Client;
