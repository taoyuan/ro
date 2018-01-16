const jayson = require('jayson');
const Method = require('./method');
const utils = require('./utils');

class Server extends jayson.Server {
	/**
	 * Constructor for a Jayson Promise Server
	 * @see Server
	 * @class PromiseServer
	 * @extends Server
	 * @return {PromiseServer}
	 */

	constructor(methods, options) {
		options = options || {};
		options.methodConstructor = options.methodConstructor || Method;
		super(methods, options);
	}
}

exports = module.exports = function (methods, options) {
	return new Server(...arguments);
};
exports.Server = Server;

Object.assign(Server, jayson.Server);
Object.assign(exports, Server);

// for type recognizing
Server.prototype.mqtt = function () {
	return require('./mqtt/server')(this, ...arguments)
};
Server.interfaces.mqtt = require('./mqtt/server');
