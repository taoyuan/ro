var ro = require('../../');

ro(function (remote, conn) {
    this.time = function (cb) { cb(new Date().toString()) };
}).listen(7000);
