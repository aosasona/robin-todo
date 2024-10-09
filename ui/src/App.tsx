import { createResource, Show } from "solid-js";
import { Route, Router } from "@solidjs/router";

import client from "@lib/client";

import SplashScreen from "@ui/splash-screen";

import { AuthContext } from "@lib/stores/auth";
import { SignIn, SignUp, Index } from "@routes/index";
import { Toaster } from "solid-toast";

export default function App() {
	const [data, { refetch }] = createResource(() => client.queries.whoami(), { name: "whoami" });
	return (
		<AuthContext.Provider value={{ data, refetch }}>
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

			<Toaster position="top-right" />
		</AuthContext.Provider>
	);
}
