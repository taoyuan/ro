var assert = require('assert');
var async = require('async');

var Server = require('../lib/server');
var Client = require('../lib/client');

var PORT = Math.floor(Math.random() * 5e4 + 1e4);

describe('handing an API', function () {

    var client, server;

    function close(done) {
        async.parallel([
            function (next) {
                if (server) {
                    server.close(next);
                } else {
                    next();
                }
            },
            function (next) {
                if (client) {
                    client.close(next);
                } else {
                    next();
                }
            }
        ], function (err) {
            done(err);
        })
    }

    beforeEach(close);
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
            server = new Server(service).listen(PORT);
            client = new Client().connect(PORT);
            client.once('up', function (remote) {
                assert.equal(remote.status, "working");
                remote.whoami(function (err, val) {
                    assert.equal(val, "server");
                    assert.ok(!err);
                    done();
                })
            });
        });

//        it('service is passed channel/remote to each call', function (done) {
//            var _channel;
//            var service = function (remote, channel) {
//                return {
//                    status: "working",
//                    whoami: function (callback) {
//                        assert.ok(remote);
//                        assert.ok(channel);
//                        assert.equal(channel, _channel);
//                        callback(null);
//                    }
//                }
//            };
//            server = new Server(service).listen(PORT);
//            server.once('connect', function (remote, channel) {
//                _channel = channel;
//            });
//            client = new Client().connect(PORT);
//            client.once('up', function (remote) {
//                remote.whoami(function (err, val) {
//                    done();
//                });
//            })
//        });
//
//        it('can send args', function (done) {
//            var _channel;
//            var service = {
//                say: function (word, callback) {
//                    callback(null, 'I said ' + word)
//                }
//            };
//            server = new Server(service).listen(PORT);
//            server.once('connect', function (remote, channel) {
//                _channel = channel
//            });
//            client = new Client().connect(PORT);
//            client.once('up', function (remote) {
//                remote.say('cows.', function (err, value) {
//                    assert.equal(value, 'I said cows.');
//                    done()
//                })
//            })
//        });
//
//        it('can send error args', function(done) {
//            var _channel;
//            var service = {
//                say: function (callback) {
//                    callback(new Error('success'))
//                }
//            };
//            server = new Server(service).listen(PORT);
//            server.once('connect', function (remote, channel) {
//                _channel = channel
//            });
//            client = new Client().connect(PORT);
//            client.once('up', function(remote) {
//                remote.say(function(err, value) {
//                    assert.equal(err.message, 'success');
//                    done()
//                })
//            })
//        })
    });

    // SERVER TEST
    // ------------------------------------------------------------------------

//    describe('server', function() {
//        it('can call client methods', function (done) {
//            var service = {
//                status: "working",
//                whoami: function (callback) {
//                    callback(null, "client")
//                }
//            };
//            server = new Server().listen(PORT);
//            server.once('connect', function (remote) {
//                assert.equal(remote.status, "working");
//                remote.whoami(function (err, val) {
//                    assert.equal(val, "client");
//                    assert.ok(!err);
//                    done()
//                })
//            });
//
//            client = new Client(service).connect(PORT)
//        });
//        it('service is passed channel/remote to each call', function (done) {
//            var _channel;
//            var service = function (remote, channel) {
//                return {
//                    status: "working",
//                    whoami: function (callback) {
//                        assert.ok(remote);
//                        assert.ok(channel);
//                        assert.equal(channel, _channel);
//                        callback(null)
//                    }
//                }
//            };
//            server = new Server().listen(PORT);
//            server.once('connect', function (remote, channel) {
//                remote.whoami(function (err, value) {
//                    done()
//                })
//            });
//            client = new Client(service).connect(PORT);
//            client.once('up', function (remote, channel) {
//                _channel = channel
//            })
//        });
//        it('can use custom error serialisation', function (done) {
//            var _channel;
//            var service = {
//                say: function (word, callback) {
//                    callback(null, 'I said ' + word)
//                }
//            };
//            server = new Server().listen(PORT);
//            server.once('connect', function (remote, channel) {
//                remote.say('cows.', function (err, value) {
//                    assert.equal(value, 'I said cows.');
//                    server.close(done)
//                })
//            });
//            client = new Client(service).connect(PORT);
//            client.once('up', function (remote, channel) {
//                _channel = channel
//            })
//        });
//        it('can send error args', function(done) {
//            var _channel;
//            var service = {
//                say: function (word, callback) {
//                    callback(new Error('success'))
//                }
//            };
//            server = new Server().listen(PORT);
//            server.once('connect', function (remote, channel) {
//                remote.say('cows.', function (err, value) {
//                    assert.equal(err.message, 'success');
//                    server.close(done)
//                })
//            });
//            client = new Client(service).connect(PORT);
//            client.once('up', function(remote, channel) {
//                _channel = channel
//            })
//        })
//
//    })
});