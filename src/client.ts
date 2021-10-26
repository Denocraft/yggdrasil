/**
 * Yggdrasil
 *
 * A port of node-yggdrasil to Deno
 * created by Blocks_n_more
 */

import { call, callbackify } from './util.ts';
import { defaultHost } from '../mod.ts';
import type { moduleOptions } from "./types.ts";

export default function loader(moduleOptions: moduleOptions) {
	/**
	 * Attempts to authenticate a user.
	 * @param  {Object}   options Config object
	 * @param  {Function} cb      Callback
	 */
	async function auth(options: Record<string, unknown>) {
		if (options.token === null) delete options.token;
		else options.token = options.token ?? crypto.randomUUID();

		options.agent = options.agent ?? 'Minecraft';

		return await call(
			moduleOptions?.host ?? defaultHost,
			'authenticate',
			{
				agent: {
					name: options.agent,
					version: options.agent === 'Minecraft' ? 1 : options.version,
				},
				username: options.user,
				password: options.pass,
				clientToken: options.token,
				requestUser: options.requestUser === true,
			},
			moduleOptions?.agent
		);
	}
	/**
	 * Refreshes a accessToken.
	 */

	async function refresh(
		accessToken: string,
		clientToken: string,
		requestUser: string
	) {
		const data = await call(
			moduleOptions?.host ?? defaultHost,
			'refresh',
			{ accessToken, clientToken, requestUser: requestUser ?? false },
			moduleOptions?.agent
		);
		if (data.clientToken !== clientToken)
			throw new Error('clientToken assertion failed');
		return [data.accessToken, data];
	}
	/**
	 * Validates an access token
	 */
	async function validate(accessToken: string) {
		return await call(
			moduleOptions?.host ?? defaultHost,
			'validate',
			{ accessToken },
			moduleOptions?.agent
		);
	}

	/**
	 * Invalidates all access tokens.
	 */
	async function signout(username: string, password: string) {
		return await call(
			moduleOptions?.host ?? defaultHost,
			'signout',
			{ username, password },
			moduleOptions?.agent
		);
	}
	return {
		auth: callbackify(auth, 1),
		refresh: callbackify(refresh, 3),
		signout: callbackify(signout, 1),
		validate: callbackify(validate, 2),
	};
}
