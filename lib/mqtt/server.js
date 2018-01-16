const assert = require('assert');
const _ = require('lodash');
const {EventEmitter} = require('events');
const PromiseA = require('bluebird');
const utils = require('../utils');

class MQTTServer extends EventEmitter {
	constructor(server, client, options, logger) {
		super();

		if (typeof options === 'string') {
			options = {topic: options};
		}
		options = _.merge({
			logger: {
				level: 'warn',
				prettyPrint: {
					forceColor: true
				}
			}
		}, options);

		assert(options.topic, '"options.topic" is required');

		if (typeof client === 'string') {
			this.client = require('mqttr').connect(client, options);
			this._owns = true;
		} else {
			this.client = client;
		}

		this.logger = logger = logger || require('pino')(options.logger);
		this.topic = options.topic;

		const that = this;
		this.subscription = this.client.subscribe(options.topic, function (topic, payload) {
			server.call(payload, function (error, success) {
				const response = error || success;
				if (!that.client.connected || !response) return;

				const shouldReply = Array.isArray(response) ? _.find(response, item => !!item.id) : response.id;

				if (shouldReply) {
					const replyTopic = topic + "/reply";
					logger.debug('< Outgoing to ("%s": %j)', replyTopic, response);
					that.client.publish(replyTopic, response);
				}
			});
		});
	}

	ready(cb) {
		cb = cb || utils.createPromiseCallback();
		this.client.ready(cb);
		return cb.promise;
	};

	close(cb) {
		cb = cb || utils.createPromiseCallback();
		this.subscription.cancel();
		if (this._owns) {
			this.logger.debug('close mqtt connection');
			this.client.end(cb)
		} else {
			cb();
		}

		return cb.promise;
	};

}

exports = module.exports = function () {
	return new MQTTServer(...arguments);
};

exports.MQTTServer = MQTTServer;
