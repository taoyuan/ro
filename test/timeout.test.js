var ro = require('../'),
    assert = require('assert');

describe('timeout', function() {
    it('timeout', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var client = ro.connect(port);

        client.up(10, function (remote) {
            assert.ok(!remote);

            on();
            client.up(1000, function (remote) {
                assert.ok(remote);
                off();
                client.close();
                done();
            });
        });

        var server;
        function on () {
            server = ro.server({});
            server.listen(port);
        }

        function off () {
            server.close();
        }
    });
});
