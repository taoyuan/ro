import * as PromiseA from "bluebird";

export function createPromiseCallback() {
	let cb;
	const promise = new PromiseA(function(resolve, reject) {
		cb = function(err, data) {
			if (err) return reject(err);
			return resolve(data);
		};
	});
	cb.promise = promise;
	return cb;
}
