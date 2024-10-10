import Button from "$/components/button";
import ProtectedPage from "$/components/protected-route";
import client from "$/lib/client";
import { useUserQuery } from "$/lib/stores/auth";
import { useNavigate } from "@solidjs/router";
import { useQueryClient } from "@tanstack/solid-query";
import { createSignal } from "solid-js";
import toast from "solid-toast";

// TODO: render completed and uncompleted tasks
// TODO: render human-readable date on hover
export default function Tasks() {
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
			toast.error((e as any)?.message || "An error occurred");
		}
	}

	return (
		<ProtectedPage>
			<div class="container max-w-screen-md mx-auto">
				<nav class="flex items-center justify-between py-2.5 px-5 rounded-md bg-neutral-200 dark:bg-neutral-800 mt-6">
					<h1>Tasks</h1>

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
			</div>
		</ProtectedPage>
	);
}
