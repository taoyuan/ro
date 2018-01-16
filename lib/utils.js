const PromiseA = require('bluebird');

exports = module.exports = require('jayson').utils;

function createPromiseCallback() {
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

exports.createPromiseCallback = createPromiseCallback;

exports.NotImplemented = function () {
	throw new Error('not implemented!');
};
