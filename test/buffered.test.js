var ro = require('../'),
    net = require('net');


describe('buffered', function () {
    it('buffered connections', function (done) {
        var t = test();
        t.plan(5);
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var client = ro.connect(port);

        for (var i = 0; i < 5; i++) {
            setTimeout(function () {
                client.up(function (remote) {
                    remote.time(function (time) {
                        t.ok(time);
                    });
                });
            }, 2000);
        }

        var server = net.createServer(ro.handler(
            function () {
                this.time = function (cb) {
                    cb(Date.now())
                };
            },
            function (connection, socket) {
                setTimeout(function () {
                    socket.end();
                }, 300);
            }
        ));

        server.listen(port);

        t.on('end', function () {
            server.close();
            client.close();
            done();
        });
    });
});
