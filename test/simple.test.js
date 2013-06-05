var ro = require('../'),
    assert = require('assert');

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
            assert.ok(r0.max < Date.now());
            assert.ok(r0.max > Date.now() - 5000);
            assert.ok(r0.max - r0.min < 10);

            assert.ok(messages[0] < messages[messages.length - 1]);
            assert.ok(messages.length > 5);

            assert.equal(counts.up, 2);
            assert.equal(counts.down, 1);
            assert.ok(counts.reconnect >= 2);

            off();
            client.close();
            clearInterval(iv);
            done();
        }

        var server;

        function on() {
            server = ro.server(function (remote, channel) {
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

    it('does not leak on.close listeners', function (_done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var client = ro.connect(port);
        var iterations = 3;
        on();

        client.once('close', function () {
            assert.equal(client.listeners('close').length, 0);
            _done();
        });
        client.on('up', function () {
            iterations--;
            off();
        });

        client.on('down', function () {
            if (iterations === 0) return done();
            return on();
        });

        function done() {
            client.close();
            server.close();
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

    it('add callbacks in channel handler', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro(function () {
            this.beep = 5;
        }).connect(port);

        client.on('remote', function (remote, channel) {
            client.up(function (remote_, conn_) {
                assert.equal(remote, remote_);
                assert.equal(channel, conn_);

                client.close();
                server.close();
                done();
            });
            channel.emit('up', remote);
        });

        var server = ro.listen(port);
    });
});
