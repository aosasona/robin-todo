import client from "$/lib/client";
import { useUserQuery } from "$/lib/stores/auth";
import { A, useNavigate } from "@solidjs/router";
import { useQueryClient } from "@tanstack/solid-query";
import { createSignal } from "solid-js";
import toast from "solid-toast";
import Button from "./button";

export default function Nav() {
	const queryClient = useQueryClient();
	const query = useUserQuery();
	const navigate = useNavigate();
	const [hideAuthPopover, setHideAuthPopover] = createSignal(true);

	async function signOut(e: Event) {
		try {
			e.preventDefault();
			e.stopPropagation();
			await client.mutations.signOut();
			await queryClient.invalidateQueries({ queryKey: ["whoami"] });
			navigate("/sign-in", { replace: true });
		} catch (e) {
			console.error(e);
			toast.error((e as any)?.message || "An error occurred");
		}
	}

	return (
		<nav class="flex items-center justify-between py-2.5 px-5 rounded-md bg-neutral-200 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 mt-6 mb-10">
			<A href="/" class="!no-underline">
				<h1>Tasks</h1>
			</A>

			<div>
				<div
					class="w-10 aspect-square bg-neutral-300 dark:bg-neutral-700 rounded-full flex items-center justify-center relative cursor-pointer"
					onClick={() => setHideAuthPopover(!hideAuthPopover())}>
					<p class="font-bold text-lg select-none">{query?.data?.username[0].toUpperCase() || "?"}</p>
					{!hideAuthPopover() ? (
						<div class="absolute top-[120%] right-0 w-max max-w-lg bg-white dark:bg-neutral-700 rounded-md shadow-md py-3 px-3 space-y-2">
							<p class=" text-base text-neutral-400 dark:text-neutral-400 ">Signed in as {query?.data?.username}</p>
							<Button onClick={signOut}>Sign out</Button>
						</div>
					) : null}
				</div>
			</div>
		</nav>
	);
}
