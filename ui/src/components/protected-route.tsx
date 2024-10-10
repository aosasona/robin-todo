import { useUserQuery } from "$/lib/stores/auth";
import { useNavigate } from "@solidjs/router";
import { createEffect, JSX } from "solid-js";

export default function ProtectedRoute(props: { children: JSX.Element }) {
	const query = useUserQuery();
	const navigate = useNavigate();

	createEffect(() => {
		if (!query.isFetching && query.data?.username === undefined) {
			navigate("/sign-in", { replace: true });
		}
	});

	return <>{props.children}</>;
}
