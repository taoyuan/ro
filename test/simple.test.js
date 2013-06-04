var ro = require('../'),
    should = require('should');

it('simple', function(done) {
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    var client = ro.client().connect(port);

    var counts = { up : 0, down : 0, reconnect : 0 };
    client.on('up', function () { counts.up ++ });
    client.on('down', function () { counts.down ++ });
    client.on('reconnect', function () { counts.reconnect ++ });
//    client.on('error', function() {});

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

    function finish () {
        var r0 = messages.slice(0,3).reduce(function (acc, x) {
            if (x > acc.max) acc.max = x;
            if (x < acc.min) acc.min = x;
            return acc;
        }, { min : Infinity, max : -Infinity });
        (r0.max < Date.now()).should.be.ok;
        (r0.max > Date.now() - 5000).should.be.ok;
        (r0.max - r0.min < 10).should.be.ok;

        (messages[0] < messages[messages.length-1]).should.be.ok;
        (messages.length > 5).should.be.ok;

        counts.up.should.equal(2);
        counts.down.should.equal(1);
        (counts.reconnect >= 2).should.be.ok;

        off();
        client.close();
        clearInterval(iv);
        done();
    }

    var server;
    function on () {
        server = ro.server(function (remote, channel) {
            this.time = function (cb) { cb(Date.now()) };
            this.ping = function (cb) { cb() };
        });
        server.listen(port);
    }

    function off () {
        server.close();
    }
});

it('does not leak on.close listeners', function(_done) {
    var port = Math.floor(Math.random() * 5e4 + 1e4);
    var client = ro.client().connect(port);
    var count = 0;
    var iterations = 3;
    on();

    client.once('close', function () {
        client.listeners('close').length.should.equal(0);
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
//    client.on('error', function() {});

    function done () {
        client.close();
        server.close();
    }

    var server;
    function on () {
        setTimeout(function() {
            server = ro.server();
            server.listen(port);
        }, 100)
    }

    function off () {
        setTimeout(function() {
            server.close();
        }, 100)
    }
});

it('add callbacks in connection handler', function (done) {
    var port = Math.floor(Math.random() * 5e4 + 1e4);

    var client = ro.client(function() {
        this.beep = 5;
    }).connect(port);

    client.on('remote', function (remote, channel) {
        client.up(function (remote_, conn_) {
            remote.should.equal(remote_);
            channel.should.equal(conn_);

            client.close();
            server.close();
            done();
        });
        channel.emit('up', remote);
    });
//    client.on('error', function() {});

    var server = ro.server();
    server.listen(port);
});
