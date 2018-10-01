const ro = require('../..');

(async () => {
	const client = ro.client.mqtt('mqtt://localhost:9999', '$rpc/server');

	const responses = [
		await client.request('add', [1, 2, 3, 4, 5]),
		await client.request('rejection', [])
	];

	console.log('add:', responses[0].result);
	console.log('rejection:', responses[1].error);

	await client.close();

})();
