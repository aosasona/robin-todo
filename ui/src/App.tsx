import { createResource, Show } from "solid-js";
import { Route, Router } from "@solidjs/router";

import client from "@lib/client";

import SplashScreen from "@ui/splash-screen";

import { AuthContext, createDeepSignal } from "./lib/stores";
import { SignIn, SignUp, Index } from "@routes/index";

export default function App() {
	const [data, { refetch }] = createResource(() => client.queries.whoami(), { name: "whoami", storage: createDeepSignal });

	return (
		<AuthContext.Provider value={{ username: data()?.data?.username ?? null, isSignedIn: data()?.ok ?? false, refetch }}>
			<Show when={data.loading}>
				<SplashScreen />
			</Show>

			<Show when={!data.loading}>
				<Router>
					<Route path="/" component={Index} />
					<Route path="/sign-in" component={SignIn} />
					<Route path="/sign-up" component={SignUp} />
				</Router>
			</Show>
		</AuthContext.Provider>
	);
}
