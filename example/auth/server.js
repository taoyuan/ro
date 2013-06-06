var ro = require('../../');

function auth_middleware(c, next) {
    c.local.auth = function (user, pass, cb) {
        if (user === 'moo' && pass === 'hax') {
            c.local = {};
            next();
            cb(null, c.local);
        }
        else cb('ACCESS DENIED')
    };
}

function service_middleware(c) {
    c.local.beep = function (fn) { fn(new Date().toString()) };
}

var server = ro.server();
server.use(auth_middleware);
server.use(service_middleware);
server.listen(7000);
