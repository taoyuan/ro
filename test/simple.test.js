var ro = require('../'),
    s = require('./support'),
    t = s.t;

describe('simple', function () {
    it('simple integration should work', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var client = ro.connect(port);

        var counts = { up: 0, down: 0, reconnect: 0 };
        client.on('up', function () {
            counts.up++
        });
        client.on('down', function () {
            counts.down++
        });
        client.on('reconnect', function () {
            counts.reconnect++
        });

        var messages = [];
        var iv = setInterval(function () {
            client.up(function (remote) {
                remote.time(function (t) {
                    messages.push(t);
                });
            });
        }, 250);

        client.once('reconnect', function () {
            client.once('up', function () {
                client.once('down', function () {
                    client.once('up', finish);
                    setTimeout(on, 50);
                });
                setTimeout(off, 50);
            });
            setTimeout(on, 50);
        });

        function finish() {
            var r0 = messages.slice(0, 3).reduce(function (acc, x) {
                if (x > acc.max) acc.max = x;
                if (x < acc.min) acc.min = x;
                return acc;
            }, { min: Infinity, max: -Infinity });
            t.ok(r0.max < Date.now());
            t.ok(r0.max > Date.now() - 5000);
            t.ok(r0.max - r0.min < 10);

            t.ok(messages[0] < messages[messages.length - 1]);
            t.ok(messages.length > 5);

            t.equal(counts.up, 2);
            t.equal(counts.down, 1);
            t.ok(counts.reconnect >= 2);

            off();
            client.close();
            clearInterval(iv);
            done();
        }

        var server;

        function on() {
            server = ro.server(function (remote, connection) {
                this.time = function (cb) {
                    cb(Date.now())
                };
                this.ping = function (cb) {
                    cb()
                };
            });
            server.listen(port);
        }

        function off() {
            server.close();
        }
    });

    it('does not leak on.close listeners', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var client = ro.connect(port);
        var iterations = 3;
        on();

        client.once('close', function () {
            t.equal(client.listeners('close').length, 0);
            done();
        });
        client.on('up', function () {
            iterations--;
            off();
        });

        client.on('down', function () {
            if (iterations === 0) return _done();
            return on();
        });

        function _done() {
            client && client.close();
            server && server.close();
        }

        var server;

        function on() {
            setTimeout(function () {
                server = ro.listen(port);
            }, 100)
        }

        function off() {
            setTimeout(function () {
                server.close();
            }, 100)
        }
    });

    it('add callbacks in connection handler', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro(function () {
            this.beep = 5;
        }).connect(port);

        client.on('remote', function (remote, connection) {
            client.up(function (remote_, conn_) {
                t.equal(remote, remote_);
                t.equal(connection, conn_);

                client && client.close();
                server && server.close();
                done();
            });
            connection.emit('up', remote);
        });

        var server = ro.listen(port);
    });
});
