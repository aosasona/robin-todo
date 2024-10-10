import { createQuery } from "@tanstack/solid-query";
import client from "../client";

export function useUserQuery() {
	const query = createQuery(() => ({
		queryKey: ["whoami"],
		queryFn: () => client.queries.whoami(),
		refetchOnMount: false,
		refetchOnReconnect: false,
		refetchOnWindowFocus: false,
		retry: false,
	}));

	return query;
}
