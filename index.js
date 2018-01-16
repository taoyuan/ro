const ro = module.exports = require('jayson');

ro.server = require('./lib/server');
ro.Server = ro.server.Server;

ro.client = require('./lib/client');
ro.Client = ro.client.Client;
