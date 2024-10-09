import { createContext, Resource, useContext } from "solid-js";
import { ResultOf, Schema } from "@lib/bindings";

type AuthContextValue = {
	data: Resource<ResultOf<Schema, "query", "whoami">>;
	refetch: () => void;
};

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuthContext must be used within an AuthContext.Provider");
	}

	return context;
}

export const AuthContext = createContext<AuthContextValue>();
