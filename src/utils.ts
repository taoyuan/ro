import * as PromiseA from "bluebird";

export interface NotifyCallback {
	(err?): void;
}

export interface PromiseCallback<T> {
	(err?, data?): void;
	promise?: Promise<T>;
}

export function createPromiseCallback<T>(): PromiseCallback<T> {
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
