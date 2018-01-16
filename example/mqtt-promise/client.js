const ro = require('../..');

const client = ro.client.mqtt('mqtt://localhost:9999', '$rpc/server');

const requests = [
	client.request('add', [1, 2, 3, 4, 5]),
	client.request('rejection', [])
];

Promise.all(requests).then(responses => {
	console.log('add:', responses[0].result);
	console.log('rejection:', responses[1].error);
}).then(() => client.close());
