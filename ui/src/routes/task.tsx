import Button from "$/components/button";
import Nav from "$/components/nav";
import ProtectedRoute from "$/components/protected-route";
import client from "$/lib/client";
import { A, useParams } from "@solidjs/router";
import { createQuery } from "@tanstack/solid-query";
import { ArrowLeft, Check, Clock } from "phosphor-solid";
import { Match, Switch } from "solid-js";
import { SolidMarkdown } from "solid-markdown";
import { useQueryClient } from "@tanstack/solid-query";
import toast from "solid-toast";

export default function Task() {
	const queryClient = useQueryClient();
	const params = useParams();

	const task = createQuery(() => ({
		queryKey: [`task-${params.id}`],
		queryFn: () => client.queries.getTodo(parseInt(params.id || "")), // this is clearly naive
		retry: 2,
	}));

	async function handleToggle() {
		try {
			await client.mutations.toggleCompleted(parseInt(params.id || ""));
			// Invalidating multiple queries at once doesn't seem to work yet either in solid-query
			await queryClient.invalidateQueries({ queryKey: ["todos"] });
			await queryClient.invalidateQueries({ queryKey: [`task-${params.id}`] });
		} catch (e) {
			toast.error((e as any)?.message || "An error occurred");
		}
	}

	return (
		<ProtectedRoute>
			<div class="container max-w-screen-md mx-auto">
				<Nav />

				<Switch fallback={<div>Task not found</div>}>
					<Match when={task.isError}>
						<div class="w-full text-center py-8 px-4 bg-red-100 dark:bg-red-600/20 border border-red-400 dark:border-red-600 rounded-md">
							<p class="text-sm font-medium text-red-800 dark:text-red-500">{task.error?.message ?? "An error occurred"}</p>
						</div>
					</Match>

					<Match when={task.isLoading}>
						<div class="w-full text-center py-8 px-4 bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 rounded-md">
							<p class="text-sm font-medium text-neutral-800 dark:text-neutral-400 animate-pulse">Loading...</p>
						</div>
					</Match>

					<Match when={task.isSuccess}>
						<div>
							<div class="flex justify-between items-center mb-6">
								<A href="/" class="flex items-center gap-x-2">
									<ArrowLeft />
									<p>Back</p>
								</A>

								<Button class="w-max" onClick={handleToggle}>
									{task.data?.completed ? (
										<span class="flex items-center gap-2 p-0 m-0">
											<Clock class="p-0 text-lg" /> <span>Mark as pending</span>
										</span>
									) : (
										<span class="flex items-center gap-2 p-0 m-0">
											<Check class="p-0 text-lg" /> <span>Mark as done</span>
										</span>
									)}
								</Button>
							</div>

							<h1 class="text-4xl font-bold mb-2">{task.data?.title}</h1>
							<div class="flex items-center gap-3 my-2">
								{task.data?.completed ? (
									<p class="bg-indigo-600/30 text-indigo-400 w-min px-2 py-1 text-xs font-medium rounded ring-1 ring-indigo-400">Done</p>
								) : (
									<p class="bg-amber-500/30 text-amber-500 w-min px-2 py-1 text-xs font-medium rounded ring-1 ring-amber-500">Pending</p>
								)}

								<p>{new Date((task.data?.createdAt ?? 0) * 1000).toLocaleString()}</p>
							</div>

							<div class="border border-neutral-800 bg-neutral-800/30 p-3 rounded-md overflow-auto mt-4">
								<SolidMarkdown children={task.data?.description || "No description provided"} class="space-y-4" />
							</div>
						</div>
					</Match>
				</Switch>
			</div>
		</ProtectedRoute>
	);
}
