exports.Counter = require('./counter');

exports.suites = require('./suites');

exports.server = {};

/*
 * Methods for the common test server
 */
exports.server.methods = {

  error: function (callback) {
    callback(this.error(-1000, 'An error message'));
  },

  incrementCounterBy: function (counter, value, callback) {
    if (!(counter instanceof exports.Counter)) {
      return callback(this.error(-1000, 'Argument not an instance of Counter'));
    }
    counter.incrementBy(value);
    callback(null, counter);
  },

  add: function (a, b, callback) {
    const result = a + b;
    callback(null, result);
  },

  add_slow: function (a, b, isSlow, callback) {
    const result = a + b;
    if (!isSlow) return callback(null, result);
    setTimeout(function () {
      callback(null, result);
    }, 15);
  },

  empty: function (arg, callback) {
    callback();
  },

  no_args: function (callback) {
    callback(null, true);
  },

  invalidError: function (arg, callback) {
    callback({invalid: true});
  },

  delay: function (delay, callback) {
    setTimeout(function () {
      callback(null, delay);
    }, delay);
  }

};

/*
 * Options for the common test server
 */
exports.server.options = {
  reviver: function (key, value) {
    if (value && value.$class === 'counter') {
      const obj = new exports.Counter();
      Object.assign(obj, value.$props);
      return obj;
    }
    return value;
  },

  replacer: function (key, value) {
    if (value instanceof exports.Counter) {
      return {$class: 'counter', $props: {count: value.count}};
    }
    return value;
  },
	collect: false
};

let next_port = 43210;

exports.buildMQTTServer = function buildMQTTServer(options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = undefined;
  }

  if (typeof options === 'number') {
    options = {port: options};
  }

  options = options || {};

  if (!options.port) options.port = next_port++;
  cb = cb || function () {};

  console.log('build mqtt server', options);

  const Server = require('mosca').Server;
  const server = new Server(options, cb);
  server.url = 'mqtt://localhost:' + options.port;
  server.port = options.port;
  return server;
};

