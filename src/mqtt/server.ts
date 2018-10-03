import {EventEmitter} from 'events';
import * as assert from 'assert';
import * as mqttr from 'mqttr';
import {createPromiseCallback} from "../utils";

export = class MQTTServer extends EventEmitter {
	client: mqttr.Client;
	logger;
	topic: string;
	subscription: mqttr.Subscription;
	protected _owns: boolean;

	constructor(server: any, client: string | mqttr.Client, options?, logger?) {
		super();

		if (typeof options === 'string') {
			options = {topic: options};
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
		} else {
			this.client = client;
		}

		this.logger = logger = logger || require('pino')(options.logger);
		this.topic = options.topic;

		this.subscription = this.client.subscribe(options.topic, (topic: string, payload: any): void => {
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
					// @ts-ignore
					this.client.publish(replyTopic, response, {qos: options.qos});
				}
			});
		}, {qos: options.qos});
	}

	static create(server: any, client: string | mqttr.Client, options?, logger?) {
		return new MQTTServer(server, client, options, logger);
	}

	ready(cb) {
		cb = cb || createPromiseCallback();
		this.client.ready(cb);
		return cb.promise;
	};

	close(cb) {
		cb = cb || createPromiseCallback();
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
