'use strict';

var t = require('./init').t;
var ro = require('../');

var PORT = Math.floor(Math.random() * 5e4 + 1e4);

describe('client', function() {
    var server, client;
    function close(done) {
        client && client.close();
        server && server.close();
        done();
    }
    afterEach(close);
    beforeEach(function(done) {
        server = ro.server();
        server.on('error', function(err) {
            throw new Error(err);
        });
        server.listen(PORT, function() {
            done();
        });
    });

    describe('close', function() {
        it('won\'t reconnect after close', function(done) {
            client = ro.client().connect(PORT);
            client.close(function() {
                done();
            });
            client.on('remote', function(remote, connection) {
                throw new Error('Should not connect after close')
            });
        });
        it('will close connection on close', function(done) {
            client = ro.client().connect(PORT);
            client.on('up', function(remote, connection) {
                client.close(function() {
                    t.ok(client.closed);
                    done();
                });
            });
        });

        it('will cancel connecting if close', function(done) {
//            server.on('connect', function() {
//                throw new Error('Should not connect');
//            });
            client = ro.client().connect(PORT);
            client.on('up', function() {
                throw new Error('Should not up');
            });
            client.up(function() {
                throw new Error('Should not up');
            }) ;
            client.close(function() {
                done();
            });
        });

        it('will successfully close multiple times after startup', function(done) {
//            server.on('connect', function() {
//                throw new Error('Should not connect');
//            });
            client = ro.client().connect(PORT);
            client.close(function() {
                client.close(function() {
                    done();
                });
            });
        });

        it('won\'t error if close multiple times', function(done) {
            client = ro.client().connect(PORT);
            client.on('up', function() {
                client.close(function(err) {
                    t.ok(!err);
                    client.close(function(err) {
                        t.ok(!err);
                        client.close(function(err) {
                            t.ok(!err);
                            client.close(function(err) {
                                t.ok(!err);
                                t.ok(client.closed);
                                done();
                            });
                        });
                    });
                });
            });
        });

        it('won\'t error if close and connect multiple times', function(done) {
            client = ro.client().connect(PORT);
            client.on('up', function() {
                client.close(function(err) {
                    t.ok(!err);
                    client.connect(PORT);
                    client.on('up', function() {
                        client.close(function(err) {
                            t.ok(!err);
                            done();
                        })
                    })
                })
            });
        });
    });

    describe('connecting to a port', function() {
        it('will use callback when listening on port', function(done) {
            client = ro.client().connect(PORT, function(remote, connection) {
                t.ok(remote);
                t.ok(connection);
                connection.emit('up', remote);
                done();
            });
        });

        it('will emit up when connected, passing connection object', function(done) {
            client = ro.client().connect(PORT);
            client.on('up', function(remote) {
                t.ok(remote);
                done();
            });
        });
        it('will emit informative error if can\'t connect', function(done) {
            client = ro.client().connect('garbage', function() {
                throw new Error('Shouldn\'t be up.')
            });
            client.on('up', function(remote) {
                throw new Error('Shouldn\'t be up.');
            });
            client.socket && client.socket.once('error', function(err) {
                t.ok(/getaddrinfo\ ENOTFOUND/.test(err.message));
                client.close(done);
            });
        })
    });
});

