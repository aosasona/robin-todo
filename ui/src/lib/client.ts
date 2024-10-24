import Client from "./bindings";

const client = Client.new({
	endpoint: import.meta.env.DEV ? "http://localhost:8081/_robin" : "/_robin",
	fetchOpts: {
		credentials: "include",
	},
});

export default client;
