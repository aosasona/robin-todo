import { useAuthContext } from "$/lib/stores/auth";
import { useNavigate } from "@solidjs/router";
import { createEffect, JSX } from "solid-js";

export default function ProtectedRoute(props: { children: JSX.Element }) {
	const auth = useAuthContext();
	const navigate = useNavigate();

	createEffect(() => {
		if (auth.data.error || (!auth?.data.loading && !auth?.data()?.username)) {
			navigate("/sign-in");
		}
	});

	// If the auth data is still loading, return null to prevent flickering
	if (auth.data.loading) {
		return null;
	}

	return <>{props.children}</>;
}
