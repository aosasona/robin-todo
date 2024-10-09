import ProtectedPage from "$/components/protected-route";

export default function Home() {
	return (
		<ProtectedPage>
			<div>
				<h1>Home</h1>
			</div>
		</ProtectedPage>
	);
}
