var ro = require('../../');
var tls = require('tls');
var client = ro.client().connect({
    createStream : tls.connect.bind(null, 7000, {rejectUnauthorized: false})
});

setInterval(function () {
    client.up(function (remote) {
        remote.time(function (t) {
            console.log('time = ' + t);
        });
    });
}, 1000);
