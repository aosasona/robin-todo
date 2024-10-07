import { createSignal, JSX } from "solid-js";
import { twMerge } from "tailwind-merge";

type Props = {
	name: string;
	label: string;
} & JSX.IntrinsicElements["input"];

export default function Input(props: Props) {
	const [focused, setFocused] = createSignal(false);

	const defaultClasses =
		"bg-neutral-200 dark:bg-neutral-800 px-3 py-2 text-sm rounded-md w-full focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500";

	const classes = twMerge(defaultClasses, props.class, ...Object.keys(props.classList ?? []));

	return (
		<div>
			<label for={props.name} class="font-medium text-neutral-900 dark:text-neutral-100 text-xs inline-block px-1 mb-1" classList={{ "opacity-50": !focused() }}>
				{props.label}
			</label>
			<input {...props} name={props.name} class={classes} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
		</div>
	);
}
