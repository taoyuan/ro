var ro = require('../'),
    t = require('./init').t;

describe('cons', function() {
    it('constructor', function (done) {
        var plan = t.plan(2, function () {
            client && client.close();
            server && server.close();
            done();
        });
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro.client(function () {
            this.beep = 5;
        }).connect(port);

        var server = ro.server(function () {
            this.boop = 6;
        });
        server.on('connect', function (remote) {
            t.equal(remote.beep, 5);
            plan.done();
        });
        server.listen(port);

        client.up(function (remote) {
            t.equal(remote.boop, 6);
            plan.done();
        });

    });
});
