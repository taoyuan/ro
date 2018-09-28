"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TimeoutError extends Error {
    constructor(props) {
        super('timeout');
        this.name = 'TimeoutError';
        Object.assign(this, props);
    }
}
exports.TimeoutError = TimeoutError;
class NotImplemented extends Error {
    constructor() {
        super('not implemented');
        this.name = 'NotImplementedError';
    }
}
exports.NotImplemented = NotImplemented;
//# sourceMappingURL=errors.js.map