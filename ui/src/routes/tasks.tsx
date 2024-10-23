import Button from "$/components/button";
import ProtectedPage from "$/components/protected-route";
import TaskModal from "$/components/task-modal";
import { ResultOf, Schema } from "$/lib/bindings";
import client from "$/lib/client";
import { A } from "@solidjs/router";
import { createQuery, useQueryClient } from "@tanstack/solid-query";
import { createSignal, Match, Switch } from "solid-js";
import toast from "solid-toast";

import { AiOutlineDelete } from "solid-icons/ai";
import Nav from "$/components/nav";

type TodoListProps = {
	header: string;
	todos: ResultOf<Schema, "mutation", "create-todo">[];
};

function TodoList(props: TodoListProps) {
	const queryClient = useQueryClient();

	async function handleDelete(id: number) {
		if (!confirm("Are you sure you want to delete this task?")) return;
		try {
			await client.mutations.deleteTodo(id);
			await queryClient.invalidateQueries({ queryKey: ["todos"] });
		} catch (e) {
			toast.error((e as any)?.message || "An error occurred");
		}
	}

	async function handleToggle(id: number) {
		try {
			await client.mutations.toggleCompleted(id);
			await queryClient.invalidateQueries({ queryKey: ["todos"] });
		} catch (e) {
			toast.error((e as any)?.message || "An error occurred");
		}
	}

	return (
		<div class="border border-neutral-300 dark:border-neutral-800 rounded-md mb-6">
			<h3 class="bg-neutral-300 dark:bg-neutral-800 font-bold text-lg px-4 py-2">{props.header}</h3>
			<div>
				{props.todos.length === 0 ? (
					<p class="text-center text-neutral-400 dark:text-neutral-500 py-4">No tasks here</p>
				) : (
					<ul>
						{props.todos.map((todo) => (
							<A href={`/tasks/${todo.id}`} class="block !no-underline focus:outline-none focus:ring focus:ring-indigo-400">
								<li
									class="border-t border-neutral-300 dark:border-neutral-800 px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/30 transition-all"
									title={"Last updated at " + new Date(todo.lastUpdated * 1000).toLocaleString()}>
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											handleToggle(todo.id);
										}}>
										<div
											class="w-4 aspect-square rounded-sm border border-neutral-300 dark:border-neutral-800 flex items-center justify-center cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/30 transition-all hover:border-neutral-400 dark:hover:border-neutral-700"
											classList={{
												"bg-indigo-400 ring-1 ring-indigo-400": todo.completed,
											}}
										/>
									</button>

									<p class="w-full font-normal truncate ml-2" classList={{ "line-through ": todo.completed }}>
										{todo.title}
									</p>

									<div class="flex items-center gap-x-2">
										<button
											type="button"
											class="text-red-500 text-lg w-max aspect-square rounded-md hover:bg-red-100 dark:hover:bg-red-600/20 p-2 transition-all"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												handleDelete(todo.id);
											}}>
											<AiOutlineDelete />
										</button>
									</div>
								</li>
							</A>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

// Obviously, we have gone the lazy route here, this is not very representative of a real-world application.
export default function Tasks() {
	const [showTaskModal, setShowTaskModal] = createSignal(false);

	const todos = createQuery(() => ({
		queryKey: ["todos"],
		queryFn: () => client.queries.listTodos(),
		retry: 3,
	}));

	return (
		<ProtectedPage>
			<div class="container max-w-screen-md mx-auto">
				<Nav />

				<Switch>
					<Match when={todos.isError}>
						<div class="w-full text-center py-8 px-4 bg-red-100 dark:bg-red-600/20 border border-red-400 dark:border-red-600 rounded-md">
							<p class="text-sm font-medium text-red-800 dark:text-red-500">{todos.error?.message ?? "An error occurred"}</p>
						</div>
					</Match>

					<Match when={todos.isLoading}>
						<div class="w-full text-center py-8 px-4 bg-neutral-300 dark:bg-neutral-800 border border-neutral-400 dark:border-neutral-700 rounded-md">
							<p class="text-sm font-medium text-neutral-800 dark:text-neutral-400 animate-pulse">Loading...</p>
						</div>
					</Match>

					<Match when={todos.isSuccess}>
						<div class="mb-6 flex justify-end">
							<Button onClick={() => setShowTaskModal(true)} class="w-max">
								Create task
							</Button>
						</div>
						<TodoList header="To-do" todos={todos.data?.incomplete ?? []} />
						<TodoList header="Completed" todos={todos.data?.complete ?? []} />
					</Match>
				</Switch>
			</div>

			<TaskModal show={showTaskModal()} onClose={() => setShowTaskModal(false)} open={() => setShowTaskModal(true)} />
		</ProtectedPage>
	);
}
