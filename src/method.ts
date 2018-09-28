import jayson = require("jayson");
import PromiseA = require("bluebird");

export class Method extends jayson.Method {
	constructor() {
		super(...arguments);
	}

	execute(server, requestParams, outerCallback) {
		let wasPromised = false;

		const promise = super.execute(server, requestParams, function() {
			if(wasPromised) {
				return; // ignore any invocations of the callback if a promise was returned
			}
			outerCallback.apply(null, arguments);
		});

		wasPromised = promise && typeof promise.then === 'function';

		// if the handler returned a promise, call the callback when it resolves
		if(wasPromised) {
			return PromiseA.resolve(promise).asCallback(outerCallback);
		}
	}
}
