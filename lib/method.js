"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jayson = require("jayson");
const PromiseA = require("bluebird");
class Method extends jayson.Method {
    constructor() {
        super(...arguments);
    }
    execute(server, requestParams, outerCallback) {
        let wasPromised = false;
        const promise = super.execute(server, requestParams, function () {
            if (wasPromised) {
                return;
            }
            outerCallback.apply(null, arguments);
        });
        wasPromised = promise && typeof promise.then === 'function';
        if (wasPromised) {
            return PromiseA.resolve(promise).asCallback(outerCallback);
        }
    }
}
exports.Method = Method;
//# sourceMappingURL=method.js.map