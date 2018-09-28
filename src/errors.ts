export class TimeoutError extends Error {
	name = 'TimeoutError';
	constructor(props?: {[name: string]: any}) {
		super('timeout');
		Object.assign(this, props);
	}
}

export class NotImplemented extends Error {
	name = 'NotImplementedError';
	constructor() {
		super('not implemented');
	}
}
