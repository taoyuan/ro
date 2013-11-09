var ro = require('../'),
    s = require('./support'),
    t = s.t;

describe('immediate', function() {
    it('immediate connection', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var server = ro.server({
            beep : function (cb) { cb('boop') }
        });

        server.listen(port, function () {
            var client = ro.connect(port);
            client.up(function (remote, connection) {
                remote.beep(function (v) {
                    t.equal(v, 'boop');
                    s.close([client, server], done);
                });
            });
        });
    });
});
