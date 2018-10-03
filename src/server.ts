/// <reference path="../typings/jayson/index.d.ts" />

import jayson = require('jayson');
import {MethodLike} from "jayson";
import * as mqttr from 'mqttr';
import {Method} from './method';
import MQTTServer = require('./mqtt/server');

export interface ROServer {
	mqtt: (client: string | mqttr.Client, options?, logger?) => MQTTServer;
}

export class Server extends jayson.Server implements ROServer {

	constructor(methods?: { [methodName: string]: MethodLike }, options?: { [name: string]: any }) {
		options = options || {};
		options.methodConstructor = options.methodConstructor || Method;
		super(methods, options);
	}

	static create(methods?: { [methodName: string]: MethodLike }, options?: { [name: string]: any }) {
		return new Server(methods, options);
	}

	// this will be override by the creation of jayson.Server
	mqtt(client: string | mqttr.Client, options?, logger?) {
		return MQTTServer.create(this, client, options, logger);
	}

}

Server.interfaces.mqtt = MQTTServer.create;

