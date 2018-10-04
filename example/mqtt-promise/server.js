const ro = require('../..');
const _ = require('lodash');

// start mosca server for test
new require('mosca').Server({port: 9999});

const server = ro.server.create({
	add: async function (args) {
		return _.reduce(args, function (sum, value) {
			return sum + value;
		}, 0);
	},

	// example on how to reject
	rejection: async function () {
		throw server.error(501, 'not implemented');
	}
});

server.mqtt('mqtt://localhost:9999', '$rpc/server');

