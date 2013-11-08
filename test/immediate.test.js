var ro = require('../'),
    t = require('./init').t;

describe('immediate', function() {
    it('immediate connection', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);
        var server = ro.server({
            beep : function (cb) { cb('boop') }
        });

        server.listen(port, function () {
            var client = ro.connect(port);
            client.up(function (remote, connection) {
                remote.beep(function (s) {
                    t.equal(s, 'boop');
                    client.close();
                    server.close();
                    done();
                });
            });
        });
    });
});
