const jayson = require('jayson');
const utils = require('./utils');

class Client extends jayson.Client {
	constructor(server, options) {
		super(...arguments);
	}

	/**
	 *  Creates a request and dispatches it if given a callback.
	 *  @param {String|Array} method A batch request if passed an Array, or a method name if passed a String
	 *  @param {Array|Object|Function} params Parameters for the method
	 *  @param {String|Number} [id] Optional id. If undefined an id will be generated. If null it creates a notification request
	 *  @param {Object|Boolean} [options] custom options for request. If false it will not send remote call
	 *  @param {Function} [callback] Request callback. If specified, executes the request rather than only returning it.
	 *  @throws {TypeError} Invalid parameters
	 *  @return {Object} JSON-RPC 1.0 or 2.0 compatible request
	 */
	request(method, params, id, options, callback) {
		const self = this;
		let request = null;

		// is this a batch request?
		const isBatch = Array.isArray(method);

		// JSON-RPC 1.0 doesn't support batching
		if (this.options.version === 1 && isBatch) {
			throw new TypeError('JSON-RPC 1.0 does not support batching');
		}

		// is this a raw request?
		const isRaw = !isBatch && method && typeof(method) === 'object';

		if (isBatch || isRaw) {
			callback = params;
			request = method;
		} else {
			if (typeof id === 'function') {
				callback = id;
				options = undefined;
				id = undefined; // specifically undefined because "null" is a notification request
			} else if (id && typeof id === 'object') { // null is object
				callback = options;
				options = id;
				id = undefined;
			}
			if (typeof options === 'function') {
				callback = options;
				options = undefined;
			}

			if (id === undefined && options !== null && typeof options === 'object') {
				id = options.id;
			}

			const hasCallback = typeof(callback) === 'function';

			try {
				request = utils.request(method, params, id, {
					generator: this.options.generator,
					version: this.options.version
				});
			} catch (err) {
				if (hasCallback) {
					return callback(err);
				}
				throw err;
			}

			// no callback and options is false means we should just return a raw request
			if (!hasCallback && options === false) {
				return request;
			}
		}

		callback = callback || utils.createPromiseCallback();

		this.emit('request', request);

		function done(err, response) {
			self.emit('response', request, response);
			self._parseResponse(err, response, callback);
		}

		if (this._request.length < 3) {
			this._request(request, done);
		} else {
			this._request(request, options, done);
		}

		return callback.promise;
	}
}

Object.assign(Client, jayson.Client);

exports = module.exports = function (server, options) {
	return new Client(...arguments);
};

Object.assign(exports, Client);

exports.Client = Client;

exports.mqtt = require('./mqtt/client');
