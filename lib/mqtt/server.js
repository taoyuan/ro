"use strict";
const events_1 = require("events");
const assert = require("assert");
const mqttr = require("mqttr");
const utils_1 = require("../utils");
module.exports = class MQTTServer extends events_1.EventEmitter {
    constructor(server, client, options, logger) {
        super();
        if (typeof options === 'string') {
            options = { topic: options };
        }
        options = Object.assign({
            qos: 1,
            logger: {
                level: 'warn',
                prettyPrint: {
                    forceColor: true
                }
            }
        }, options);
        assert(options.topic, '"options.topic" is required');
        if (typeof client === 'string') {
            this.client = mqttr.connect(client, options);
            this._owns = true;
        }
        else {
            this.client = client;
        }
        this.logger = logger = logger || require('pino')(options.logger);
        this.topic = options.topic;
        this.subscription = this.client.subscribe(options.topic, (topic, payload) => {
            server.call(payload, (error, success) => {
                const response = error || success;
                if (!this.client.connected || this.client.disconnecting || !response) {
                    logger.debug('The client is disconnected or disconnecting. Ignore response!');
                    return;
                }
                const shouldReply = Array.isArray(response) ? response.find(item => !!item.id) : response.id;
                if (shouldReply) {
                    const replyTopic = topic + "/reply";
                    logger.debug('< Outgoing to ("%s": %j)', replyTopic, response);
                    this.client.publish(replyTopic, response, { qos: options.qos });
                }
            });
        }, { qos: options.qos });
    }
    static create(server, client, options, logger) {
        return new MQTTServer(server, client, options, logger);
    }
    ready(cb) {
        cb = cb || utils_1.createPromiseCallback();
        this.client.ready(cb);
        return cb.promise;
    }
    ;
    close(cb) {
        cb = cb || utils_1.createPromiseCallback();
        this.subscription.cancel();
        if (this._owns) {
            this.logger.debug('close mqtt connection');
            this.client.end(cb);
        }
        else {
            cb();
        }
        return cb.promise;
    }
    ;
};
//# sourceMappingURL=server.js.map