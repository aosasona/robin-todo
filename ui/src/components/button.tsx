import { JSX, ParentProps } from "solid-js";
import { twMerge } from "tailwind-merge";

type Props = ParentProps & JSX.IntrinsicElements["button"];

export default function Button(props: Props) {
	const defaultClasses =
		"bg-neuteral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 w-full text-sm py-2 px-6 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-neutral-300";

	const classes = twMerge(defaultClasses, props.class, ...Object.keys(props.classList ?? []));

	return (
		<button {...props} class={classes}>
			{props.children}
		</button>
	);
}
