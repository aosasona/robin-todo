/* @refresh reload */
import { ErrorBoundary, render } from "solid-js/web";
import App from "./App";

import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";

const wrapper = document.getElementById("root");

if (!wrapper) {
	throw new Error("Wrapper div not found");
}

const queryClient = new QueryClient();

function ErrorFallback(err: unknown, reset: () => void) {
	return (
		<div class="w-screen h-screen flex flex-col items-center justify-center space-y-4">
			<h1 class="text-3xl font-bold">Something went wrong</h1>
			<p>Error: {err?.toString()}</p>
			<button onClick={reset} class="bg-red-500 text-white text-sm font-semibold px-2.5 py-1.5 rounded-md ring-1 ring-red-400 hover:bg-red-600 hover:border-red-500 transition-all">
				Try again
			</button>
		</div>
	);
}

render(
	() => (
		<ErrorBoundary fallback={ErrorFallback}>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</ErrorBoundary>
	),
	wrapper
);
