var s = require('./support'),
    t = s.t;
var ro = require('../');

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
        client && client.close();
        server && server.close();
        done();
    }

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
                        t.ok(!err);
                        t.ok(!isTaken);
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
                    t.ok(!err);
                    server.close(function (err) {
                        t.ok(!err);
                        server.close(function (err) {
                            t.ok(!err);
                            server.close(function (err) {
                                t.ok(!err);
                                isPortTaken(PORT, function (err, isTaken) {
                                    t.ok(!err);
                                    t.ok(!isTaken);
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
                t.ok(!err);
                isPortTaken(PORT, function (err, isTaken) {
                    t.ok(!err);
                    t.ok(isTaken);
                    done();
                })
            })
        });
//        it('will emit ready when listening on port', function (done) {
//            server = ro.server().listen(PORT);
//            server.on('ready', function () {
//                isPortTaken(PORT, function (err, isTaken) {
//                    t.ok(!err);
//                    t.ok(isTaken);
//                    done();
//                })
//            })
//        });
    });


    describe('connections', function () {
        beforeEach(function (done) {
            server = ro.server().listen(PORT, done)
        });
        it('should emit connect events', function (done) {
            server.once('connect', function (remote, connection) {
                t.ok(remote);
                t.ok(connection);
//                t.ok(connection.id);
                done()
            });
            client = ro.client().connect(PORT)
        });
        it('should emit disconnect events', function (done) {
            server.once('connect', function (remote, connection) {
                server.once('disconnect', function (disconnected) {
                    t.equal(connection, disconnected);
                    done();
                });
                client.close();
            });
            client = ro.client().connect(PORT);
        });
        describe('server.connections', function () {
            it('should start with zero connections', function () {
                t.equal(server.connections.length, 0);
            });
            it('should hold connections', function (done) {
                client = ro.client().connect(PORT, function (remote, conn) {
                    t.equal(server.connections.length, 1);
                    done();
                });
            });
            it('should remove connections', function (done) {
                client = ro.client().connect(PORT, function (remote, conn) {
                    t.equal(server.connections.length, 1);
                    client.close(function () {
                        t.equal(server.connections.length, 0);
                        done();
                    });
                })
            });
            it('should remove multiple connections', function (done) {
                client = ro.client().connect(PORT, function (remote, conn) {
                    t.equal(server.connections.length, 1);
                    var client2 = ro.client().connect(PORT, function (remote, conn) {
                        t.equal(server.connections.length, 2);
                        client.close(function () {
                            t.equal(server.connections.length, 1);
                            client2.close(function () {
                                t.equal(server.connections.length, 0);
                                done();
                            })
                        })
                    })
                })
            });
            it('should hold multiple connections', function(done) {
                client = ro.client().connect(PORT, function(remote1, conn1) {
                    t.equal(server.connections.length, 1);
                    var client2 = ro.client().connect(PORT, function(remote2, conn2) {
                        t.equal(server.connections.length, 2);
                        client2.close(function() {
                            done();
                        })
                    })
                })
            })
        })
    })
});