<script lang="ts">
	import '../app.css';
	import Header from '../components/Header.svelte';
	
	let { children } = $props();
	const appTitle = "Square Footage App";
</script>

<div class="flex flex-col min-h-screen">
	<Header title={appTitle} />
	<main class="flex-grow container mx-auto p-4">
		{@render children()}
	</main>
</div>
