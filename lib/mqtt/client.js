"use strict";
const timers = require("timers");
const assert = require("assert");
const util = require("util");
const PromiseA = require("bluebird");
const client_1 = require("../client");
const errors_1 = require("../errors");
const utils_1 = require("../utils");
module.exports = class MQTTClient extends client_1.Client {
    static create(client, options, logger) {
        return new MQTTClient(client, options, logger);
    }
    constructor(client, options, logger) {
        let opts;
        if (typeof options === 'string') {
            opts = { topic: options };
        }
        else {
            opts = options;
        }
        assert(opts, '"options" is required');
        assert(opts.topic, '"opts.topic" is required');
        if (typeof opts.timeout === 'undefined') {
            opts.timeout = 100;
        }
        opts = Object.assign({
            logger: {
                level: 'warn',
                prettyPrint: {
                    forceColor: true
                }
            }
        }, opts);
        super(opts);
        this.options = opts;
        if (typeof client === 'string') {
            this.client = require('mqttr').connect(client, opts);
            this._owns = true;
        }
        else {
            this.client = client;
        }
        this.logger = logger || require('pino')(opts.logger);
        this.topic = opts.topic;
        this.subscriptions = {};
        this.pendings = {};
        this.idmap = {};
    }
    _request(request, options, callback) {
        const { client } = this;
        if (typeof options === 'number') {
            options = { timeout: options };
        }
        options = Object.assign({}, this.options, options);
        const topic = options.topic;
        const timeout = options.timeout || 0;
        if (!topic)
            throw new Error('"topic" is required');
        const ids = request.id ? [request.id] : [];
        if (Array.isArray(request)) {
            request.forEach((req) => req.id && ids.push(req.id));
        }
        this.ready(() => {
            if (timeout && ids.length) {
                const replyTopic = topic + "/reply";
                if (!this.subscriptions[replyTopic]) {
                    this.logger.debug("Subscribing to", replyTopic);
                    this.subscriptions[replyTopic] = client.subscribe(replyTopic, (topic, payload) => {
                        this._handleResponse(topic, payload);
                    });
                }
            }
            this.logger.debug("< Outgoing to %s : %j", topic, request);
            client.publish(topic, request, () => {
                if (timeout && ids.length) {
                    const timer = timers.setTimeout(() => {
                        if (this.pendings[ids.toString()]) {
                            callback(new errors_1.TimeoutError({
                                timeout: timeout,
                                message: util.format('Timeout of %dms request %s: %j', timeout, topic, request)
                            }));
                        }
                        this._removePending(ids, true);
                        if (this.logger.isLevelEnabled('debug')) {
                            this.logger.debug("id:%j - Call to service %s - timed out after %d seconds", ids, topic, timeout / 1000);
                        }
                    }, timeout);
                    ids.forEach(id => this.idmap[id] = ids);
                    this.pendings[ids.toString()] = {
                        timer,
                        done: callback,
                    };
                }
                else {
                    callback();
                }
            });
        });
    }
    ;
    _handleResponse(topic, payload) {
        this.logger.debug("< Incoming to %s : %j", topic, payload);
        let res = payload;
        if (Array.isArray(payload)) {
            res = payload.find(item => item.id);
        }
        const id = res && res.id;
        if (!id) {
            return this.logger.debug("Failed to decode reply: %j", payload);
        }
        const ids = this.idmap[id];
        const pending = this._removePending(ids);
        if (pending) {
            pending.done(null, payload);
        }
    }
    ;
    _removePending(ids, isTimeout) {
        if (!ids)
            return;
        const pending = this.pendings[ids.toString()];
        if (pending) {
            if (!isTimeout)
                clearTimeout(pending.timer);
            delete this.pendings[ids.toString()];
            ids.forEach(id => delete this.idmap[id]);
        }
        return pending;
    }
    ;
    ready(cb) {
        return PromiseA.fromCallback(cb => this.client.ready(cb)).asCallback(cb);
    }
    ;
    close(cb) {
        cb = cb || utils_1.createPromiseCallback();
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
//# sourceMappingURL=client.js.map