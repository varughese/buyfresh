/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { WegmansStore } from './wegmans';

interface Env {
	BUYFRESH_KV: KVNamespace;
}

async function handleSearch(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const query = url.searchParams.get('q');

	if (!query) {
		return new Response('Missing search query parameter "q"', { status: 400 });
	}

	const wegmans = new WegmansStore(env.BUYFRESH_KV);
	const results = await wegmans.search(query);

	return new Response(JSON.stringify(results), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
		},
	});
}

export default {
	async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
		try {
			const url = new URL(request.url);

			if (url.pathname === '/search') {
				return handleSearch(request, env);
			}

			return new Response('Not found', { status: 404 });
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return new Response(`Server error: ${(error as any).message}`, { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
