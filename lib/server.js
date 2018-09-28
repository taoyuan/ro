"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jayson = require("jayson");
const method_1 = require("./method");
class Server extends jayson.Server {
    static create(methods, options) {
        return new Server(methods, options);
    }
    constructor(methods, options) {
        options = options || {};
        options.methodConstructor = options.methodConstructor || method_1.Method;
        super(methods, options);
    }
}
exports.Server = Server;
Server.interfaces.mqtt = require('./mqtt/server').create;
//# sourceMappingURL=server.js.map