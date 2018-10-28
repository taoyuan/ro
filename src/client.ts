import {
	Client as JaysonClient,
	Server as JaysonServer,
	ClientOptions,
	RequestParamsLike,
	JSONRPCCallbackType,
	JSONRPCResultLike, JSONRPCErrorLike,
} from "jayson";

import {createPromiseCallback, NotifyCallback} from "./utils";

const {utils} = require('jayson');

export interface RequestOptions {
	[name: string]: any;
}

export interface JSONRPCResponse {
	error: JSONRPCErrorLike;
	result: JSONRPCResultLike;
}

export class Client extends JaysonClient {

	options: { [name: string]: any };

	constructor(server: JaysonServer, options?: ClientOptions);
	constructor(options: ClientOptions);

	constructor(server, options?) {
		super(server, options);
	}

	remcall(method: string, params: RequestParamsLike, id?: string, options?: RequestOptions, callback?: JSONRPCCallbackType): Promise<JSONRPCResponse> | undefined;
	remcall(method: string, params: RequestParamsLike, id?: string, callback?: JSONRPCCallbackType): Promise<JSONRPCResponse> | undefined;
	remcall(method: string, params: RequestParamsLike, options?: RequestOptions, callback?: JSONRPCCallbackType): Promise<JSONRPCResponse> | undefined;
	remcall(method: string, params: RequestParamsLike, callback?: JSONRPCCallbackType): Promise<JSONRPCResponse> | undefined;

	remcall(method, params, id?, options?, callback?) {
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

		callback = callback || createPromiseCallback();

		this.emit('request', request);

		const done = (err, response) => {
			this.emit('response', request, response);
			// @ts-ignore
			this._parseResponse(err, response, callback);
		};

		// @ts-ignore
		if (this._request.length < 3) {
			// @ts-ignore
			this._request(request, done);
		} else {
			// @ts-ignore
			this._request(request, options, done);
		}

		return callback.promise;
	}

	ready(cb: NotifyCallback) {
		throw new Error('Unimplemented');
	}

	close(): Promise<any>;
	close(cb: NotifyCallback): undefined;
	close(cb?: NotifyCallback): Promise<any> | undefined {
		throw new Error('Unimplemented');
	}

	static mqtt(client: any, options?, logger?): Client {
		return require('./mqtt/client').create(client, options, logger);
	}
}
