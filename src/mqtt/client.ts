"use strict";

import timers = require('timers');
import assert = require('assert');
import util = require('util');
import PromiseA = require('bluebird');
import mqttr = require('mqttr');
import {Client} from '../client';
import {Subscription} from "mqttr/lib";
import {TimeoutError} from "../errors";
import {createPromiseCallback} from "../utils";

interface MQTTClientOptions {
	[name: string]: any;
}

interface Pending {
	timer: NodeJS.Timer;
	done: (err?: any, data?: any) => void;
}

export = class MQTTClient extends Client {
	options: any;
	client: mqttr.Client;
	topic: string;
	logger: any;
	subscriptions: { [topic: string]: Subscription };
	pendings: { [ids: string]: Pending };
	idmap: { [id: string]: string[] };
	protected _owns: boolean;

	static create(client: any, options?: string | MQTTClientOptions, logger?) {
		return new MQTTClient(client, options, logger);
	}

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
	constructor(client: any, options?: string | MQTTClientOptions, logger?) {

		let opts: MQTTClientOptions;
		if (typeof options === 'string') {
			opts = {topic: options};
		} else {
			opts = <MQTTClientOptions> options;
		}

		assert(opts, '"options" is required');
		assert(opts.topic, '"opts.topic" is required');

		// set default timeout
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
		} else {
			this.client = client;
		}

		this.logger = logger || require('pino')(opts.logger);
		this.topic = opts.topic;

		this.subscriptions = {};
		this.pendings = {};
		this.idmap = {};
	}

	_request(request, options, callback) {
		const {client} = this;

		if (typeof options === 'number') {
			options = {timeout: options};
		}
		options = Object.assign({}, this.options, options);

		const topic = options.topic;
		const timeout = options.timeout || 0;

		// topic is required
		if (!topic) throw new Error('"topic" is required');

		//if (Array.isArray(request)) throw new Error('Array request not supported now');

		const ids = request.id ? [request.id] : [];
		if (Array.isArray(request)) {
			request.forEach((req) => req.id && ids.push(req.id));
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
					const timer: NodeJS.Timer = timers.setTimeout(() => {

						if (this.pendings[ids.toString()]) {
							callback(new TimeoutError({
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
					ids.forEach(id => this.idmap[id] = ids);

					this.pendings[ids.toString()] = {
						timer,
						done: callback,
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
	};

	_removePending(ids, isTimeout?: boolean) {
		if (!ids) return;

		const pending = this.pendings[ids.toString()];
		if (pending) {
			if (!isTimeout) clearTimeout(pending.timer);

			delete this.pendings[ids.toString()];
			ids.forEach(id => delete this.idmap[id]);
		}
		return pending;
	};

	ready(cb) {
		return PromiseA.fromCallback(cb => this.client.ready(cb)).asCallback(cb);
	};


	close(cb) {
		cb = cb || createPromiseCallback();
		if (this._owns) {
			this.logger.debug('close mqtt connection');
			this.client.end(cb)
		} else {
			cb();
		}

		return cb.promise;
	};
}

