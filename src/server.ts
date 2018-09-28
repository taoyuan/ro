import jayson = require('jayson');
import {MethodLike} from "jayson";
import {Method} from './method';

export class Server extends jayson.Server {

	static create(methods?: { [methodName: string]: MethodLike }, options?: {[name: string]: any}) {
		return new Server(methods, options);
	}

	constructor(methods?: { [methodName: string]: MethodLike }, options?: {[name: string]: any}) {
		options = options || {};
		options.methodConstructor = options.methodConstructor || Method;
		super(methods, options);
	}

}

Server.interfaces.mqtt = require('./mqtt/server').create;

