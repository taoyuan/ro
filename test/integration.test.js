var t = require('./init').t;
var ro = require('../');

var PORT = Math.floor(Math.random() * 5e4 + 1e4);

describe('integration/handing an API', function () {

    var client, server;

    function close(done) {
        client && client.close();
        server && server.close();
        done();
    }

    afterEach(close);

    // CLIENT TEST
    // ------------------------------------------------------------------------

    describe('client', function () {
        it('can call server methods', function (done) {
            var service = {
                status: "working",
                whoami: function (callback) {
                    callback(null, "server")
                }
            };
            server = ro.server(service).listen(PORT);
            client = ro.client().connect(PORT);
            client.once('up', function (remote) {
                t.equal(remote.status, "working");
                remote.whoami(function (err, val) {
                    t.equal(val, "server");
                    t.ok(!err);
                    done();
                })
            });
        });

        it('service is passed connection/remote to each call', function (done) {
            var _channel;
            var service = function (remote, connection) {
                return {
                    status: "working",
                    whoami: function (callback) {
                        t.ok(remote);
                        t.ok(connection);
                        t.equal(connection, _channel);
                        callback(null);
                    }
                }
            };
            server = ro.server(service).listen(PORT);
            server.once('connect', function (remote, connection) {
                _channel = connection;
            });
            client = ro.client().connect(PORT);
            client.once('up', function (remote) {
                remote.whoami(function (err, val) {
                    done();
                });
            })
        });

        it('can send args', function (done) {
            var _channel;
            var service = {
                say: function (word, callback) {
                    callback(null, 'I said ' + word)
                }
            };
            server = ro.server(service).listen(PORT);
            server.once('connect', function (remote, connection) {
                _channel = connection
            });
            client = ro.client().connect(PORT);
            client.once('up', function (remote) {
                remote.say('cows.', function (err, value) {
                    t.equal(value, 'I said cows.');
                    done()
                })
            })
        });

        it('can send error args', function(done) {
            var _channel;
            var service = {
                say: function (callback) {
                    callback(new Error('success'))
                }
            };
            server = ro.server(service).listen(PORT);
            server.once('connect', function (remote, connection) {
                _channel = connection
            });
            client = ro.client().connect(PORT);
            client.once('up', function(remote) {
                remote.say(function(err, value) {
                    t.equal(err.message, 'success');
                    done()
                })
            })
        })
    });

    // SERVER TEST
    // ------------------------------------------------------------------------

    describe('server', function() {
        it('can call client methods', function (done) {
            var service = {
                status: "working",
                whoami: function (callback) {
                    callback(null, "client")
                }
            };
            server = ro.server().listen(PORT);
            server.once('connect', function (remote) {
                t.equal(remote.status, "working");
                remote.whoami(function (err, val) {
                    t.equal(val, "client");
                    t.ok(!err);
                    done()
                })
            });

            client = ro.client(service).connect(PORT)
        });
        it('service is passed connection/remote to each call', function (done) {
            var _channel;
            var service = function (remote, connection) {
                return {
                    status: "working",
                    whoami: function (callback) {
                        t.ok(remote);
                        t.ok(connection);
                        t.equal(connection, _channel);
                        callback(null)
                    }
                }
            };
            server = ro.server().listen(PORT);
            server.once('connect', function (remote, connection) {
                remote.whoami(function (err, value) {
                    done()
                })
            });
            client = ro.client(service).connect(PORT);
            client.once('up', function (remote, connection) {
                _channel = connection
            })
        });
        it('can use custom error serialisation', function (done) {
            var _channel;
            var service = {
                say: function (word, callback) {
                    callback(null, 'I said ' + word)
                }
            };
            server = ro.server().listen(PORT);
            server.once('connect', function (remote, connection) {
                remote.say('cows.', function (err, value) {
                    t.equal(value, 'I said cows.');
                    server.close(done)
                })
            });
            client = ro.client(service).connect(PORT);
            client.once('up', function (remote, connection) {
                _channel = connection
            })
        });
        it('can send error args', function(done) {
            var _channel;
            var service = {
                say: function (word, callback) {
                    callback(new Error('success'))
                }
            };
            server = ro.server().listen(PORT);
            server.once('connect', function (remote, connection) {
                remote.say('cows.', function (err, value) {
                    t.equal(err.message, 'success');
                    server.close(done)
                })
            });
            client = ro.client(service).connect(PORT);
            client.once('up', function(remote, connection) {
                _channel = connection
            })
        });

    })
});