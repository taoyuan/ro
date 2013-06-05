var ro = require('../../');
var client = ro.connect(7000);

setInterval(function () {
    client.up(function (remote) {
        remote.time(function (t) {
            console.log('time = ' + t);
        });
    });
}, 1000);
