var ro = require('../'),
    assert = require('assert');

describe('immediate', function() {
    it('immediate connection', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var server = ro.server({
            beep : function (cb) { cb('boop') }
        });

        server.listen(port, function () {
            var client = ro.connect(port);
            client.up(function (remote, channel) {
                remote.beep(function (s) {
                    assert.equal(s, 'boop');
                    client.close();
                    server.close();
                    done();
                });
            });
        });
    });
});
