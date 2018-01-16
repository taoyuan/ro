const should = require('should');
const support = require('.');
const ro = require('../..');
const Counter = support.Counter;

/**
 * Get a mocha suite for common test cases for a client
 * @param {Client} ro.Client instance to use
 * @return {Function}
 */
exports.testCommonForClient = function(client) {

	return function() {

		it('should be an instance of jayson.Client', function() {
			client.should.be.instanceof(ro.Client);
		});

		it('should be able to request a success-method on the server', function(done) {
			const a = 11, b = 12;
			client.request('add', [a, b], function(err, error, result) {
				if(err || error) return done(err || error);
				should.exist(result);
				result.should.equal(a + b);
				done();
			});
		});

		it('should be able to request an error-method on the server', function(done) {
			client.request('error', [], function(err, error, result) {
				if(err) return done(err);
				should.not.exist(result);
				should.exist(error);
				error.should.have.property('message', 'An error message');
				error.should.have.property('code', -1000);
				done();
			});
		});

		it('should support reviving and replacing', function(done) {
			const a = 2, b = 1;
			const instance = new Counter(a);
			client.request('incrementCounterBy', [instance, b], function(err, error, result) {
				should.not.exist(err);
				should.not.exist(error);
				should.exist(result);
				result.should.be.instanceof(Counter).and.not.equal(instance, 'not the same object');
				result.should.have.property('count', a + b);
				done();
			});
		});

		it('should be able to handle a notification', function(done) {
			client.request('add', [3, 4], null, function(err) {
				if(err) return done(err);
				arguments.length.should.equal(0);
				done();
			});
		});

		it('should be able to handle a batch request', function(done) {
			const batch = [
				client.request('add', [4, 9], undefined, false),
				client.request('add', [10, 22], undefined, false)
			];
			client.request(batch, function(err, responses) {
				should.not.exist(err);
				should.exist(responses);
				responses.should.be.instanceof(Array).and.have.length(2);
				responses[0].result.should.equal(4 + 9);
				responses[1].result.should.equal(10 + 22);
				done();
			});
		});

	};
};
