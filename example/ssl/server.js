var ro = require('../../'),
    fs = require('fs');

var opts = {
    key: fs.readFileSync(__dirname + '/keys/key.pem'),
    cert: fs.readFileSync(__dirname + '/keys/cert.pem')
};


var server = ro.server(function (remote, conn) {
    this.time = function (cb) { cb(new Date().toString()) };
}, {ssl: opts});
server.listen(7000, function() {
    console.log(
        'SSL server listening on %s:%d',
        '0.0.0.0', 7000
    );
});