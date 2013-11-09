var ro = require('../'),
    s = require('./support'),
    t = s.t;

describe('auth', function () {
    it('authenticate state', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro.connect(port, function (remote, conn) {
            remote.auth('moo', 'hax', function (err, res) {
                t.ok(res);

                if (err) t.fail(err);
                else conn.emit('up', res)
            });
        });

        var times = 10;
        var iv = setInterval(function () {
            client.up(function (remote) {
                remote.beep(function (s) {
                    times--;
                    if (times === 5) {
                        server.close();
                        connect();
                    }
                    else if (times === 0) {
                        client.close();
                        server.close();
                        clearInterval(iv);
                        done();
                    }
                });
            });
        }, 200);

        function service() {
            return  {
                beep: function (fn) {
                    fn(new Date().toString());
                }
            }
        }

        var server = null;

        function connect() {
            server = ro.server(function (client, conn) {
                this.auth = function (user, pass, cb) {
                    if (user === 'moo' && pass === 'hax') {
                        cb(null, service());
                    }
                    else cb('ACCESS DENIED')
                };
            });
            server.listen(port);
        }

        connect();
    });
});
