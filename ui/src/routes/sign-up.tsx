import Button from "$/components/button";
import Input from "$/components/input";
import { useUserQuery } from "@lib/stores/auth";
import client from "$/lib/client";
import { A, useNavigate } from "@solidjs/router";
import { createEffect } from "solid-js";
import toast from "solid-toast";

export default function SignUp() {
	const query = useUserQuery();
	const navigate = useNavigate();

	createEffect(() => {
		if (!query.isPending && query.isSuccess && query.data?.username) {
			navigate("/", { replace: true });
		}
	});

	async function handleSubmit(e: Event) {
		try {
			e.preventDefault();
			e.stopPropagation();

			const form = e.target as HTMLFormElement;
			const data = new FormData(form);

			const username = data.get("username") as string;
			const password = data.get("password") as string;
			const confirm_password = data.get("confirm_password") as string;

			if (username.length < 3) {
				throw new Error("Username must be at least 3 characters long");
			}

			if (password !== confirm_password) {
				throw new Error("Passwords do not match");
			}

			await client.mutations.signUp({ username, password });
			navigate("/sign-in");
		} catch (e) {
			toast.error((e as { message: any }).message);
		}
	}

	return (
		<div class="container w-screen h-screen flex flex-col items-center justify-center">
			<form class="w-full max-w-sm text-left" onSubmit={handleSubmit}>
				<h1>Sign Up</h1>
				<p class="text-neutral-200 dark:text-neutral-500 mt-2">Fill in the form below to create an account</p>

				<div class="space-y-2 my-6">
					<Input name="username" type="text" placeholder="jdoe" label="Username" required />
					<Input name="password" type="password" placeholder="******" label="Password" required />
					<Input name="confirm_password" type="password" placeholder="******" label="Confirm Password" required />
				</div>

				<Button type="submit">Sign Up</Button>

				<A href="/sign-in" class="text-neutral-900 dark:text-neutral-100  mt-3 block text-center">
					Aready have an account? Sign in
				</A>
			</form>
		</div>
	);
}
