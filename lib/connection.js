/**
 * From 'upnode/lib/server_handle.js' - v0.4.3
 */

var dnode = require('dnode');

module.exports = function (cons) {
    var d = dnode(cons),
        socket,
        iv = null;

    d.on('local', function (local) {
        if (!local.ping) {
            local.ping = function (cb) {
                if (typeof cb === 'function') cb();
            };
        }
    });

    d.on('remote', function (remote) {
        iv = setInterval(function () {
            if (typeof remote.ping === 'function') {
                var to = setTimeout(function () {
                    d.end();
                }, 10 * 10000);

                remote.ping(function () {
                    clearTimeout(to);
                });
            }
        }, 10 * 1000);

    });

    function onend() {
        socket.destroy();
        if (iv !== null) clearInterval(iv);

        if (!d.__done) {
            d.__done = true;
            d.emit('disconnect');
            d.emit('done');
        }
    }

    d.on('pipe', function (target) {
        if (!socket) {
            socket = target;

            socket.once('end', onend);
            socket.once('disconnect', onend);
            socket.once('close', onend);
            socket.once('error', onend);
        }
    });

    return d;
};
