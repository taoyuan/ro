var ro = require('../'),
    midst = require('midst'),
    assert = require('assert');

describe('midst', function() {
    it('use midst to build services', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var m = midst();
        m.use(function(c) {
            c.local.boo = 1;
            c.local.time = function (cb) { cb(new Date().toString()) };
        });

        function cons(remote, channel) {
            m.handle({
                local: this,
                remote: remote,
                channel: channel
            })
        }

        var server = ro(cons).listen(port);
        var client = ro().connect(port);
        client.up(function(remote) {
            assert.equal(remote.boo, 1);
            remote.time(function(val) {
                assert.ok(val);
                off();
            })
        });

        function off() {
            client.close();
            server.close(done);
        }
    });
});

