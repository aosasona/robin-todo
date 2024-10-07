import { AuthContext } from "$/lib/stores";
import { useNavigate } from "@solidjs/router";
import { createEffect, useContext } from "solid-js";

export default function Home() {
	const d = useContext(AuthContext);

	const navigate = useNavigate();

	createEffect(() => {
		console.log(d);
		if (!d?.isSignedIn) {
			navigate("/sign-in");
		}
	});

	return (
		<div>
			<h1>Home</h1>
		</div>
	);
}
