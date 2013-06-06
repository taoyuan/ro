var ro = require('../'),
    midst = require('midst');

describe('midst', function() {
    it('use midst to build server services', function (done) {
        var t = test();
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var server = ro.server();
        server.use(function(c) {
            c.local.boo = 1;
            c.local.time = function (cb) { cb(new Date().toString()) };
        });
        server.listen(port);

        var client = ro().connect(port);
        client.up(function(remote) {
            t.equal(remote.boo, 1);
            remote.time(function(val) {
                t.ok(val);
                off();
            })
        });

        function off() {
            client.close();
            server.close(done);
        }
    });

    it('use midst to build client services', function (done) {
        var t = test();
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro.client();
        client.use(function(c) {
            c.local.boo = 1;
            c.local.time = function (cb) { cb(new Date().toString()) };
        });
        client.connect(port);

        var server = ro.server().listen(port);

        server.on('connect', function(remote) {
            t.equal(remote.boo, 1);
            remote.time(function(val) {
                t.ok(val);
                off();
            })
        });

        function off() {
            client.close();
            server.close(done);
        }
    });

    it('use midst to build server and client services by top interface', function (done) {
        var t = test();
        t.plan(4);
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var server = ro()
            .use(function(c) {
                c.local.serverBoo = 1;
                c.local.serverTime = function (cb) { cb(new Date().toString()) };
            })
            .listen(port);

        var client = ro()
            .use(function(c) {
                c.local.clientBoo = 2;
                c.local.clientTime = function (cb) { cb(new Date().toString()) };
            })
            .connect(port);

        client.up(function(remote) {
            t.equal(remote.serverBoo, 1);
            remote.serverTime(function(val) {
                t.ok(val);
            })
        });

        server.on('connect', function(remote) {
            t.equal(remote.clientBoo, 2);
            remote.clientTime(function(val) {
                t.ok(val);
            })
        });

        function off() {
            client.close();
            server.close(done);
        }

        t.on('end', off);
    });
});

