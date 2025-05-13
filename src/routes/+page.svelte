<script lang="ts">
	import AddressCalculator from '../components/AddressCalculator.svelte';
</script>

<div class="py-8">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold mb-4">Calculate Your Space</h2>
		<p class="text-lg mb-6 max-w-2xl mx-auto">Welcome to the Square Footage App. Start measuring and managing your spaces efficiently.</p>
	</div>
	
	<div class="max-w-6xl mx-auto px-4">
		<AddressCalculator />
	</div>
</div>
