var debug = require('debug')('ro:middleware');

module.exports = exports = function(target) {

    var proto = target || {},
        stack = [];

    proto.use = function use(fn, middleware) {
        var self = this;

        // wrap sub-middleware
        if (('function' === typeof fn.handle) && middleware) {
            var o = fn;
            fn = function(remote, channel) {
                o.handle.call(self, remote, channel);
            }
        }

        // add the middleware
        debug('use %s', fn.name || 'anonymous');

        stack.push(fn);

        return this;
    };


    /**
     * Handle host requests, punting them down the middleware stack.
     */
    proto.handle = function handle(remote, channel) {
        var self = this,
            i, handler;

        for (i = 0; i < stack.length; i++) {
            handler = stack[i];
            debug('%s', handler.name || 'anonymous');
            handler.call(self, remote, channel);
        }
    };

    return proto;

};

