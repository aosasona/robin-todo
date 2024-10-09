import Client, { RequestOpts } from "./bindings";

export function httpClient(url: string, opts?: RequestOpts): Promise<Response> {
	return fetch(url, {
		method: opts?.method || "GET",
		headers: opts?.headers || {},
		body: opts?.body || undefined,
		credentials: "include",
	});
}

const client = Client.new({
	endpoint: "http://localhost:8081/_robin",
	clientFn: httpClient,
});

export default client;
