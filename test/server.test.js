var assert = require('assert');
var async = require('async');

var ro = require('../');

var dnode = require('dnode');
var PORT = Math.floor(Math.random() * 5e4 + 1e4);

function isPortTaken(port, callback) {
    var net = require('net');
    var tester = net.createServer();
    tester.once('error', function (err) {
        if (err.code == 'EADDRINUSE') {
            callback(null, true);
        } else {
            callback(err);
        }
    });
    tester.once('listening', function () {
        tester.once('close', function () {
            callback(null, false);
        });
        tester.close();
    });
    tester.listen(port);
}

describe('server', function () {
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

    describe('close', function () {
        it('will close port on close', function (done) {
            server = ro.server();
            server.on('error', function (err) {
                throw new Error(err);
            });
            server.listen(PORT, function () {
                server.close(function () {
                    isPortTaken(PORT, function (err, isTaken) {
                        assert.ok(!err);
                        assert.ok(!isTaken);
                        done();
                    });
                });
            });
        });

        it('won\'t error if close twice', function (done) {
            server = ro.server();
            server.on('error', function (err) {
                throw new Error(err);
            });
            server.listen(PORT, function () {
                server.close(function (err) {
                    assert.ok(!err);
                    server.close(function (err) {
                        assert.ok(!err);
                        server.close(function (err) {
                            assert.ok(!err);
                            server.close(function (err) {
                                assert.ok(!err);
                                isPortTaken(PORT, function (err, isTaken) {
                                    assert.ok(!err);
                                    assert.ok(!isTaken);
                                    done();
                                });
                            });
                        });
                    });
                });
            });
        });
    });

    describe('listening on a port', function () {
        it('will use callback when listening on port', function (done) {
            server = ro.server().listen(PORT, function (err) {
                assert.ok(!err);
                isPortTaken(PORT, function (err, isTaken) {
                    assert.ok(!err);
                    assert.ok(isTaken);
                    done();
                })
            })
        });
        it('will emit ready when listening on port', function (done) {
            server = ro.server().listen(PORT);
            server.on('ready', function () {
                isPortTaken(PORT, function (err, isTaken) {
                    assert.ok(!err);
                    assert.ok(isTaken);
                    done();
                })
            })
        })
    });


    describe('channels', function () {
        beforeEach(function (done) {
            server = ro.server().listen(PORT, done)
        });
        it('should emit connect events', function (done) {
            server.once('connect', function (remote, channel) {
                assert.ok(remote);
                assert.ok(channel);
//                assert.ok(channel.id);
                done()
            });
            var client = dnode.connect(PORT)
        });
        it('should emit disconnect events', function (done) {
            server.once('connect', function (remote, channel) {
                server.once('disconnect', function (disconnected) {
                    assert.equal(channel, disconnected);
                    done();
                });
                client.close();
            });
            client = ro.client().connect(PORT);
        });
        describe('server.channels', function () {
            it('should start with zero channels', function () {
                assert.equal(server.channels.length, 0);
            });
            it('should hold channels', function (done) {
                client = ro.client().connect(PORT, function (remote, conn) {
                    assert.equal(server.channels.length, 1);
                    done();
                })
            });
            it('should remove channels', function (done) {
                client = ro.client().connect(PORT, function (remote, conn) {
                    assert.equal(server.channels.length, 1);
                    client.close(function () {
                        assert.equal(server.channels.length, 0);
                        done();
                    });
                })
            });
            it('should remove multiple channels', function (done) {
                client = ro.client().connect(PORT, function (remote, conn) {
                    assert.equal(server.channels.length, 1);
                    var client2 = ro.client().connect(PORT, function (remote, conn) {
                        assert.equal(server.channels.length, 2);
                        client.close(function () {
                            assert.equal(server.channels.length, 1);
                            client2.close(function () {
                                assert.equal(server.channels.length, 0);
                                done();
                            })
                        })
                    })
                })
            });
            it('should hold multiple channels', function(done) {
                client = ro.client().connect(PORT, function(remote1, conn1) {
                    assert.equal(server.channels.length, 1);
                    var client2 = ro.client().connect(PORT, function(remote2, conn2) {
                        assert.equal(server.channels.length, 2);
                        client2.close(function() {
                            done();
                        })
                    })
                })
            })
        })
    })
});