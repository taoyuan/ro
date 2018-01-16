const _ = require('lodash');
const jayson = require('jayson');
const PromiseA = require('bluebird');

class Method extends jayson.Method {
	constructor() {
		super(...arguments);
	}

	execute(server, requestParams, outerCallback) {
		let wasPromised = false;

		const promise = jayson.Method.prototype.execute.call(this, server, requestParams, function() {
			if(wasPromised) {
				return; // ignore any invocations of the callback if a promise was returned
			}
			outerCallback.apply(null, arguments);
		});

		wasPromised = promise && _.isFunction(promise.then);

		// if the handler returned a promise, call the callback when it resolves
		if(wasPromised) {
			return PromiseA.resolve(promise).asCallback(outerCallback);
		}
	}
}

module.exports = Method;
