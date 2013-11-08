var chai = require('chai');
var t = chai.assert;

exports.t = t;

t.plan = function (count, done) {
    return {
        done: function () {
            if (--count === 0) done();
        }
    }
};

//takeOverConsole('warn');

function takeOverConsole(forceMethod) {
    function intercept(method) {
        var original = console[forceMethod || method];
        console[method] = function () {
            // do sneaky stuff
            if (original.apply) {
                // Do this for normal browsers
                original.apply(console, arguments);
            } else {
                // Do this for IE
                var message = Array.prototype.slice.apply(arguments).join(' ');
                original(message);
            }
        }
    }

    var methods = ['log', 'warn', 'error'];
    for (var i = 0; i < methods.length; i++) {
        intercept(methods[i])
    }
}