var ro = require('../../'),
    fs = require('fs');

var opts = {
    keyFile: 'keys/key.pem',
    certFile: 'keys/cert.pem'
};


var server = ro.server(function (remote, conn) {
    this.time = function (cb) { cb(new Date().toString()) };
});
server.listen(7000, {ssl: opts}, function() {
    console.log(
        'SSL server listening on %s:%d',
        '0.0.0.0', 7000
    );
});