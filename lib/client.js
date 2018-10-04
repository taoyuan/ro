"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jayson_1 = require("jayson");
const utils_1 = require("./utils");
const MQTTClient = require("./mqtt/client");
const { utils } = require('jayson');
class Client extends jayson_1.Client {
    constructor(server, options) {
        super(server, options);
    }
    request(method, params, id, options, callback) {
        let request = null;
        const isBatch = Array.isArray(method);
        if (this.options.version === 1 && isBatch) {
            throw new TypeError('JSON-RPC 1.0 does not support batching');
        }
        const isRaw = !isBatch && method && typeof (method) === 'object';
        if (isBatch || isRaw) {
            callback = params;
            request = method;
        }
        else {
            if (typeof id === 'function') {
                callback = id;
                options = undefined;
                id = undefined;
            }
            else if (id && typeof id === 'object') {
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
            const hasCallback = typeof (callback) === 'function';
            try {
                request = utils.request(method, params, id, {
                    generator: this.options.generator,
                    version: this.options.version
                });
            }
            catch (err) {
                if (hasCallback) {
                    return callback(err);
                }
                throw err;
            }
            if (!hasCallback && options === false) {
                return request;
            }
        }
        callback = callback || utils_1.createPromiseCallback();
        this.emit('request', request);
        const done = (err, response) => {
            this.emit('response', request, response);
            this._parseResponse(err, response, callback);
        };
        if (this._request.length < 3) {
            this._request(request, done);
        }
        else {
            this._request(request, options, done);
        }
        return callback.promise;
    }
    static mqtt(client, options, logger) {
        return MQTTClient.create(client, options, logger);
    }
}
exports.Client = Client;
//# sourceMappingURL=client.js.map