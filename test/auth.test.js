var ro = require('../'),
    assert = require('assert');

describe('auth', function() {
    it('authenticate state', function (done) {
        var port = Math.floor(Math.random() * 5e4 + 1e4);

        var client = ro.connect(port, function (remote, conn) {
            remote.auth('moo', 'hax', function (err, res) {
                assert.ok(res);

                if (err) assert.fail(err);
                else conn.emit('up', res)
            });
        });

        var times = 10;
        var iv = setInterval(function () {
            client.up(function (remote) {
                remote.beep(function (s) {
                    times --;
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

        function auth_middleware(c, next) {
            c.local.auth = function (user, pass, cb) {
                if (user === 'moo' && pass === 'hax') {
                    c.local = {};
                    next();
                    cb(null, c.local);
                }
                else cb('ACCESS DENIED')
            };
        }

        function service_middleware(c) {
            c.local.beep = function (fn) { fn(new Date().toString()) };
        }

        var server = null;
        function connect () {
            server = ro.server();
            server.use(auth_middleware);
            server.use(service_middleware);
            server.listen(port);
        }
        connect();
    });
});
