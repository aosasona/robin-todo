import { Route, Router } from "@solidjs/router";

import { SignIn, SignUp, Tasks } from "@routes/index";
import { Toaster } from "solid-toast";

export default function App() {
	return (
		<>
			<Router>
				<Route path="/" component={Tasks} />
				<Route path="/sign-in" component={SignIn} />
				<Route path="/sign-up" component={SignUp} />
			</Router>

			<Toaster position="top-right" />
		</>
	);
}
