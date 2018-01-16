"use strict";

const assert = require('assert');
const _ = require('lodash');
const util = require('util');
const PromiseA = require('bluebird');
const {Client} = require('../client');
const errors = require('../errors');
const utils = require('../utils');

class MQTTClient extends Client {
	/**
	 *  Constructor for a RemJson HTTPS Client
	 *  @class MQTTClient
	 *  @constructor
	 *  @extends Client
	 *  @param {Object|String} client The mqtt client or mqtt url
	 *  @param {Object|String} options The options or topic string
	 *  @param {String} options.topic The topic string
	 *  @param {Object} [options.log] The log object
	 *  @param {Number} [options.timeout] The request timeout in millis second, default is 100
	 *  @param {Object} [logger] The log object
	 *  @return {MQTTClient}
	 *  @api public
	 */
	constructor(client, options, logger) {

		if (typeof options === 'string') {
			options = {topic: options};
		}

		assert(options, '"options" is required');
		assert(options.topic, '"options.topic" is required');

		// set default timeout
		if (typeof options.timeout === 'undefined') {
			options.timeout = 100;
		}

		options = Object.assign({
			logger: {
				level: 'warn',
				prettyPrint: {
					forceColor: true
				}
			}
		}, options);

		super(options);

		if (typeof client === 'string') {
			this.client = require('mqttr').connect(client, options);
			this._owns = true;
		} else {
			this.client = client;
		}

		this.logger = logger || require('pino')(options.logger);
		this.topic = options.topic;

		this.subscriptions = {};
		this.pendings = {};
		this.idmap = {};
	}

	_request(request, options, callback) {
		const {client} = this;

		if (typeof options === 'number') {
			options = {timeout: options};
		}
		options = _.assign({}, this.options, options);

		const topic = options.topic;
		const timeout = options.timeout || 0;

		// topic is required
		if (!topic) throw new Error('"topic" is required');

		//if (Array.isArray(request)) throw new Error('Array request not supported now');

		const ids = request.id ? [request.id] : [];
		if (Array.isArray(request)) {
			_.forEach(request, (req) => req.id && ids.push(req.id));
		}

		this.ready(() => {
			// subscribe reply if timeout is provided
			if (timeout && ids.length) {
				const replyTopic = topic + "/reply";

				if (!this.subscriptions[replyTopic]) {
					this.logger.debug("Subscribing to", replyTopic);

					this.subscriptions[replyTopic] = client.subscribe(replyTopic, (topic, payload) => {
						// handle response
						this._handleResponse(topic, payload);
					});
				}
			}

			this.logger.debug("< Outgoing to %s : %j", topic, request);

			// publish request
			client.publish(topic, request, () => {
				if (timeout && ids.length) {
					const timer = setTimeout(() => {

						if (this.pendings[ids]) {
							callback(new errors.TimeoutError({
								timeout: timeout,
								message: util.format('Timeout of %dms request %s: %j', timeout, topic, request)
							}));
						}

						this._removePending(ids, true);

						if (this.logger.isLevelEnabled('debug')) {
							this.logger.debug("id:%j - Call to service %s - timed out after %d seconds", ids, topic, timeout / 1000);
						}
					}, timeout);

					// map id -> ids
					_.forEach(ids, id => this.idmap[id] = ids);

					this.pendings[ids] = {
						done: callback,
						timer: timer
					};
				} else {
					callback();
				}
			});
		});
	};

	_handleResponse(topic, payload) {
		this.logger.debug("< Incoming to %s : %j", topic, payload);

		let res = payload;
		if (Array.isArray(payload)) {
			res = _.find(payload, 'id');
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
	};

	_removePending(ids, isTimeout) {
		if (!ids) return;

		const pending = this.pendings[ids];
		if (pending) {
			if (!isTimeout) clearTimeout(pending.timer);

			delete this.pendings[ids];
			_.forEach(ids, id => delete this.idmap[id]);
		}
		return pending;
	};

	ready(cb) {
		return PromiseA.fromCallback(cb => this.client.ready(cb)).asCallback(cb);
	};


	close(cb) {
		cb = cb || utils.createPromiseCallback();
		if (this._owns) {
			this.logger.debug('close mqtt connection');
			this.client.end(cb)
		} else {
			cb();
		}

		return cb.promise;
	};
}

exports = module.exports = function (client, options, logger) {
	return new MQTTClient(...arguments);
};

exports.MQTTClient = MQTTClient;
