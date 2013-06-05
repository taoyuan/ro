var ro = require('../');

describe('cons', function() {
    it('constructor', function (done) {
        var t = test();
        t.plan(2);
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro.client(function () {
            this.beep = 5;
        }).connect(port);

        var server = ro.server(function () {
            this.boop = 6;
        });
        server.on('connect', function (remote) {
            t.equal(remote.beep, 5);
        });
        server.listen(port);

        client.up(function (remote) {
            t.equal(remote.boop, 6);
        });

        t.on('end', function() {
            client.close();
            server.close();
            done();
        });
    });
});
