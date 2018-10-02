"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jayson = require("jayson");
const method_1 = require("./method");
const MQTTServer = require("./mqtt/server");
class Server extends jayson.Server {
    constructor(methods, options) {
        options = options || {};
        options.methodConstructor = options.methodConstructor || method_1.Method;
        super(methods, options);
    }
    static create(methods, options) {
        return new Server(methods, options);
    }
}
exports.Server = Server;
Server.interfaces.mqtt = MQTTServer.create;
//# sourceMappingURL=server.js.map