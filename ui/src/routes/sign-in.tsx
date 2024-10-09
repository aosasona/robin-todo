import Button from "$/components/button";
import Input from "$/components/input";
import client from "$/lib/client";
import { useAuthContext } from "@lib/stores/auth";
import { A, useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import toast from "solid-toast";

export default function SignIn() {
	const auth = useAuthContext();
	const navigate = useNavigate();

	createEffect(() => {
		if (!auth?.data.loading && !!auth?.data()?.username) {
			navigate("/");
		}
	});

	if (auth.data.loading) {
		return null;
	}

	async function handleSubmit(e: Event) {
		try {
			e.preventDefault();
			e.stopPropagation();

			const form = e.target as HTMLFormElement;
			const data = new FormData(form);

			const username = data.get("username") as string;
			const password = data.get("password") as string;

			await client.mutations.signIn({ username, password });
			auth.refetch();
			navigate("/");
		} catch (e) {
			toast.error((e as { message: any }).message);
		}
	}

	return (
		<div class="container w-screen h-screen flex flex-col items-center justify-center">
			<form class="w-full max-w-sm text-left" onSubmit={handleSubmit}>
				<h1>Sign In</h1>
				<p class="text-neutral-200 dark:text-neutral-500 mt-2">Enter your credentials to continue</p>

				<div class="space-y-2 my-6">
					<Input name="username" type="text" placeholder="jdoe" label="Username" required />
					<Input name="password" type="password" placeholder="******" label="Password" required />
				</div>

				<Button type="submit">Sign In</Button>

				<A href="/sign-up" class="text-neutral-900 dark:text-neutral-100  mt-3 block text-center">
					Don't have an account? Sign up
				</A>
			</form>
		</div>
	);
}
