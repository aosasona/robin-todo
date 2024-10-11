import toast from "solid-toast";
import Input from "./input";
import Button from "./button";
import { useQueryClient } from "@tanstack/solid-query";
import client from "$/lib/client";
import { createEffect, createSignal } from "solid-js";

import { autofocus } from "@solid-primitives/autofocus";
import { useKeyDownEvent } from "@solid-primitives/keyboard";

type Props = {
	show: boolean;
	onClose: () => void;
	open: () => void;
};

// TODO: render human-readable date on hover
export default function TaskModal(props: Props) {
	const queryClient = useQueryClient();

	const [isSaving, setSaving] = createSignal(false);

	const event = useKeyDownEvent();
	createEffect(() => {
		const e = event();

		if (!e) return;

		switch (e.key) {
			case "Escape":
				props.onClose();
				break;

			case "n":
				props.open();
				break;
		}
	});

	// WARN: this is how you would do it with Tanstack but it appears to be broken at this moment and there exists no documentation on how to use it
	//
	// const createTodoMutation = createMutation(() => ({
	// 	mutationKey: ["create-todo"],
	// 	mutationFn: client.mutations.createTodo,
	// 	onError: (e) => {
	// 		toast.error((e as any)?.message || "An error occurred");
	// 	},
	// 	onSettled: () => {
	// 		queryClient.invalidateQueries({ queryKey: ["todos"] });
	// 	},
	// }));

	async function handleSubmit(e: Event) {
		try {
			setSaving(true);
			e.preventDefault();
			e.stopPropagation();

			const form = e.target as HTMLFormElement;
			const formData = new FormData(form);

			const title = formData.get("title") as string;
			const description = formData.get("description") as string;
			const completed = formData.get("completed") === "on";

			if (!title) {
				toast.error("Title is required");
				return;
			}

			await client.mutations.createTodo({ title, description, completed });
			await queryClient.invalidateQueries({ queryKey: ["todos"] });
		} catch (e) {
			toast.error((e as any)?.message || "An error occurred");
		} finally {
			setSaving(false);
			props.onClose();
		}
	}

	return (
		<>
			{props.show ? (
				<>
					<div class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center"></div>
					<div class="fixed inset-0 z-[99] flex items-center justify-center select-none">
						<div class="bg-white dark:bg-neutral-900 rounded-lg w-full max-w-lg">
							<h2 class="text-xl font-bold p-4 border-b border-b-neutral-800">Create a new task</h2>
							<form onSubmit={handleSubmit}>
								<div class="px-4 py-3 space-y-4">
									<Input name="title" label="Title" placeholder="Do thing" ref={autofocus} autofocus />

									<textarea
										name="description"
										class="bg-neutral-200 dark:bg-neutral-800 px-3 py-2 text-sm rounded-md w-full focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500"
										rows={4}
										placeholder="Description"></textarea>

									<div class="flex items-center space-x-2">
										<input type="checkbox" name="completed" id="completed" value="on" class="w-4 h-4" />
										<label for="completed" class="font-medium">
											Completed
										</label>
									</div>
								</div>

								<div class="w-full flex justify-end space-x-4 border-t border-t-neutral-800 p-3">
									<button type="button" class="w-max px-3 text-red-500 text-sm font-semibold focus:outline-red-500 rounded-md" onClick={props.onClose}>
										Cancel
									</button>
									<Button type="submit" class="w-max" disabled={isSaving()}>
										{isSaving() ? "Creating..." : "Create task"}
									</Button>
								</div>
							</form>
						</div>
					</div>
				</>
			) : (
				<></>
			)}
		</>
	);
}
