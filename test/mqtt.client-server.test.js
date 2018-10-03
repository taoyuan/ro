"use strict";

const should = require('should');
const mqttr = require('mqttr');
const ro = require('..');
const support = require('./support');
const suites = support.suites;

const Counter = require('./support/counter');
const coder = {
	code: 0x42,
	type: Counter,
	encode: function (obj) {
		const buf = new Buffer(4);
		buf.writeInt32BE(obj.count, 0);
		return buf;
	},
	decode: function (data) {
		return new Counter(data.readInt32BE(0));
	}
};

describe('RemJson.MQTT', function () {

	const mqttserver = support.buildMQTTServer();

	after(function (done) {
		mqttserver.close(done);
	});

	describe('server', function () {

		it('should support mqtt client and not owned the client', function (done) {
			const mqttclient = mqttr.connect(mqttserver.url);
			mqttclient.ready(function () {
				const server = ro.server.create(support.server.methods, support.server.options).mqtt(mqttclient, '$foo');
				server.client.should.equal(mqttclient);
				server.topic.should.equal('$foo');
				server.ready(function () {
					server.close(function () {
						mqttclient.connected.should.ok();
						mqttclient.end(done);
					});
				});
			});
		});

		it('should support mqtt url and owned the mqtt client', function (done) {
			const server = ro.server.create(support.server.methods, support.server.options).mqtt(mqttserver.url, '$foo');
			server.topic.should.equal('$foo');
			server.ready(function () {
				server.close(function () {
					server.client.connected.should.not.ok();
					done();
				});
			});
		});
	});

	describe('client', function () {
		let mqttserver;

		before(function (done) {
			mqttserver = support.buildMQTTServer(done);
		});

		after(function (done) {
			mqttserver.close(done);
		});

		it('should support topic string in construct options', function (done) {
			const client = ro.client.mqtt(mqttserver.url, '$foo');
			client.options.topic.should.equal('$foo');
			client.options.timeout.should.equal(100);
			client.close(done);
		});

		it('should support timeout in request options', function (done) {
			const client = ro.client.mqtt(mqttserver.url, {topic: '$foo', timeout: 54321});
			client.options.topic.should.equal('$foo');
			client.options.timeout.should.equal(54321);
			client.close(done);
		});

		it('should support timeout number in request options', function (done) {
			const client = ro.client.mqtt(mqttserver.url, {topic: '$foo', timeout: 54321});
			client.request('unknown', [], undefined, 1, function (err) {
				should.exist(err);
				err.name.should.equal('TimeoutError');
				err.timeout.should.equal(1);
				client.close(done);
			});
		});

		it('should support mqtt client and not owned the client', function (done) {
			const mqttclient = mqttr.connect(mqttserver.url);
			mqttclient.ready(function () {
				const client = ro.client.mqtt(mqttclient, '$foo');
				client.client.should.equal(mqttclient);
				client.topic.should.equal('$foo');
				client.ready(function () {
					client.close(function () {
						mqttclient.connected.should.ok();
						mqttclient.end(done);
					});
				});
			});
		});

		it('should ignore non-id response', function (done) {
			const mqttclient = mqttr.connect(mqttserver.url);
			mqttclient.subscribe('$foo', function (topic, payload) {
				topic.should.equal('$foo');
				should.exist(payload.id);
				payload.method.should.equal('bar');
				delete payload.id;
				should.not.exist(payload.id);
				mqttclient.publish('$foo/reply', payload);
			});

			const client = ro.client.mqtt(mqttserver.url, '$foo');
			// timeout 1s is enough to receive response
			client.request('bar', [1], {timeout: 1000}, function (err, error, result) {
				should.exist(err);
				err.name.should.equal('TimeoutError');
				err.timeout.should.equal(1000);
				should.not.exist(error);
				should.not.exist(result);
				client.close(function () {
					mqttclient.connected.should.ok();
					mqttclient.end(done);
				});
			});
		});
	});

	describe('integration', function () {

		const options = {
			topic: '$foo',
			codec: 'msgpack',
			coder,
			logger: {
				level: 'debug'
			},
		};

		const server = ro.server.create(support.server.methods, support.server.options).mqtt(mqttserver.url, options);
		const client = ro.client.mqtt(mqttserver.url, options);

		before(function (done) {
			server.ready(function () {
				client.ready(done);
			});
		});

		after(function (done) {
			client.close(function () {
				server.close(done);
			});
		});

		describe('common tests', suites.testCommonForClient(client));

		describe('request', function () {
			it('should return immediately with timeout is 0', function (done) {
				const a = 11, b = 12;
				client.request('add', [a, b], {timeout: 0}, function (err, error, result) {
					should.not.exist(err);
					should.not.exist(error);
					should.not.exist(result);
					done();
				});
			});

			it('should callback with timeout error when request is timeout', function (done) {
				const a = 11, b = 12;
				client.request('add_slow', [a, b, true], {timeout: 1}, function (err, error, result) {
					should.exist(err);
					err.name.should.equal('TimeoutError');
					should.not.exist(error);
					should.not.exist(result);
					done();
				});
			});
		})
	});
});
