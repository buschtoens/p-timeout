'use strict';

class TimeoutError extends Error {
	constructor(message) {
		super(message);
		this.name = 'TimeoutError';
	}
}

const pTimeout = (promise, milliseconds, fallback, options) => new Promise((resolve, reject) => {
	if (typeof milliseconds !== 'number' || milliseconds < 0) {
		throw new TypeError('Expected `milliseconds` to be a positive number');
	}

	if (milliseconds === Infinity) {
		resolve(promise);
		return;
	}

	options = {
		customTimers: {setTimeout, clearTimeout},
		...options
	};

	const timer = options.customTimers.setTimeout(() => {
		if (typeof fallback === 'function') {
			try {
				resolve(fallback());
			} catch (error) {
				reject(error);
			}

			return;
		}

		const message = typeof fallback === 'string' ? fallback : `Promise timed out after ${milliseconds} milliseconds`;
		const timeoutError = fallback instanceof Error ? fallback : new TimeoutError(message);

		if (typeof promise.cancel === 'function') {
			promise.cancel();
		}

		reject(timeoutError);
	}, milliseconds);

	(async () => {
		try {
			resolve(await promise);
		} catch (error) {
			reject(error);
		} finally {
			options.customTimers.clearTimeout(timer);
		}
	})();
});

module.exports = pTimeout;
// TODO: Remove this for the next major release
module.exports.default = pTimeout;

module.exports.TimeoutError = TimeoutError;
