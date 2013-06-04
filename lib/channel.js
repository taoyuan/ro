/**
 * From 'upnode/lib/server_handle.js' - v0.4.3
 */

var dnode = require('dnode');

module.exports = function (cons) {
    var d = dnode(cons),
        stream,
        iv = null;

    d.on('local', function (local) {
        if (local.ping === undefined) {
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
        stream.destroy();
        if (iv !== null) clearInterval(iv);

        if (!d._done) {
            d._done = true;
            d.emit('done');
        }
    }

    d.on('pipe', function (target) {
        if (!stream) {
            stream = target;

            stream.once('end', onend);
            stream.once('disconnect', onend);
            stream.once('close', onend);
            stream.once('error', onend);
        }
    });

    return d;
};
