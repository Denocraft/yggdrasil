/**
 * Yggdrasil
 *
 * A port of node-yggdrasil to Deno
 * ported by Blocks_n_more
 */

import { createHash } from 'https://deno.land/std@0.113.0/node/crypto.ts';
import { mcHexDigest, call, callbackify } from './util.ts';
import { defaultHost } from '../mod.ts';
import type { moduleOptions } from "./types.ts";

export default function loader(moduleOptions: moduleOptions) {
	/**
	 * Client's Mojang handshake call
	 * See http://wiki.vg/Protocol_Encryption#Client
	 */
	const join = async (
		accessToken: string,
		selectedProfile: string,
		serverid: string,
		sharedsecret: string,
		serverkey: string
	) => {
		return await call(
			moduleOptions?.host ?? defaultHost,
			'session/minecraft/join',
			{
				accessToken,
				selectedProfile,
				serverId: mcHexDigest(
					createHash('sha1')
						.update(serverid)
						.update(sharedsecret)
						.update(serverkey)
						.digest()
				),
			},
			moduleOptions?.agent
		);
	};

	/**
	 * Server's Mojang handshake call
	 */
	const hasJoined = async (
		username: string,
		serverid: string,
		sharedsecret: string,
		serverkey: string
	) => {
		const host = moduleOptions?.host ?? defaultHost;
		const hash = mcHexDigest(
			createHash('sha1')
				.update(serverid)
				.update(sharedsecret)
				.update(serverkey)
				.digest()
		);
		const data = await fetch(
			`${host}/session/minecraft/hasJoined?username=${encodeURIComponent(
				username
			)}&serverId=${hash}`,
			// @ts-ignore refer to util.ts:30
			{ agent: moduleOptions?.agent, method: 'GET' }
		);
		const body = JSON.parse(await data.text());
		if (body.id !== undefined) return body;
		else throw new Error('Failed to verify username!');
	};

	return {
		join: callbackify(join, 5),
		hasJoined: callbackify(hasJoined, 4),
	};
}
