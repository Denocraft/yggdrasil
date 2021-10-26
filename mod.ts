/**
 * Yggdrasil
 * 
 * A port of node-yggdrasil to Deno
 * created by Blocks_n_more
 */

export const YggVersion = "1.6.1";
export const defaultHost = 'https://sessionserver.mojang.com';

import Client from './src/client.ts';
import Server from './src/server.ts';

export default Client;

export const server = Server;