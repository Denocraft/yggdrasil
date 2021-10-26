/**
 * Yggdrasil
 *
 * A port of node-yggdrasil to Deno
 * created by Blocks_n_more
 */
import { Buffer } from 'https://deno.land/std@0.113.0/node/buffer.ts';
import { YggVersion } from '../mod.ts';

const headers = {
	'User-Agent': `node-yggdrasil/${YggVersion}`,
	'Content-Type': 'application/json',
};

/**
 * Generic POST request
 */
const makeCall = async (
	host: string,
	path: string,
	data: Record<string, unknown>,
	agent: unknown
) => {
	let response: Response;
	try {
		response = await fetch(`${host}/${path}`, {
			method: 'POST',
			headers,
			body: JSON.stringify(data),
			// @ts-ignore it seems like Deno doesn't support this but i'll leave it in for now
			agent,
		});
		// Seems like deno throws an error now instead of having a .errorMessage property
	} catch (e) {
		throw new Error(e);
	}
	let body = await response.text();
	if (body.length === 0) return '';
	try {
		body = JSON.parse(body);
	} catch (e) {
		if (e instanceof SyntaxError) {
			if (response.status === 403) {
				if (body.includes('Request blocked.')) {
					throw new Error('Request blocked by CloudFlare');
				}
				if (body.includes('cf-error-code">1009')) {
					throw new Error('Your IP is banned by CloudFlare');
				}
			} else {
				throw new Error(
					`Response is not JSON. Status code: ${
						response.status ?? 'no status code'
					}`
				);
			}
		} else {
			throw e;
		}
	}
	return body;
};

export function mcHexDigest(hash: Buffer | string, encoding?: string) {
	if (!(hash instanceof Buffer)) {
		hash = Buffer.from(hash, encoding);
	}
	// check for negative hashes
	const negative = hash.readInt8(0) < 0;
	if (negative) performTwosCompliment(hash);
	return (negative ? '-' : '') + hash.toString('hex').replace(/^0+/g, '');
}

/**
 * Java's stupid hashing method
 * @param  {Buffer|String} hash     The hash data to stupidify
 * @param  {String} encoding Optional, passed to Buffer() if hash is a string
 * @return {String}          Stupidified hash
 */
export const callbackify = (f: (...args: (unknown & string & Record<string, unknown>)[]) => unknown, maxParams: number) => {
	return function (...args: unknown[]) {
		// Prevent deno from yelling at me that it can't assin unknown properties
		let cb: undefined | ((...args: unknown[]) => unknown) | unknown = undefined;
		let i: number = args.length;
		while (cb === undefined && i > 0) {
			if (typeof args[i - 1] === 'function') {
				cb = args[i - 1];
				args[i - 1] = undefined;
				args[maxParams] = cb;
				break;
			}
			i--;
		}
		// @ts-ignore it *should* work
		return f(...args).then(
			(r: unknown[]) => {
				if (r[0] !== undefined) {
					// @ts-ignore it *should* work
					cb?.(undefined, ...r);
					return r[r.length - 1];
				} else {
					// @ts-ignore it *should* work
					cb?.(undefined, r);
					return r;
				}
			},
			(err: unknown) => {
				if (typeof cb === 'function') cb(err);
				else throw err;
			}
		);
	};
};

/**
 * Java's annoying hashing method.
 * All credit to andrewrk
 * https://gist.github.com/andrewrk/4425843
 */
const performTwosCompliment = (buffer: Buffer) => {
	let carry = true;
	let i, newByte, value;
	for (i = buffer.length - 1; i >= 0; --i) {
		value = buffer.readUInt8(i);
		newByte = ~value & 0xff;
		if (carry) {
			carry = newByte === 0xff;
			buffer.writeUInt8(carry ? 0 : newByte + 1, i);
		} else {
			buffer.writeUInt8(newByte, i);
		}
	}
}

export const call = callbackify(makeCall, 4);