<script lang="ts">
	import AddressCalculator from '../components/AddressCalculator.svelte';
	import PropertyMap from '../components/map/PropertyMap.svelte';
	import type { GeocodingResult } from '$lib/services/geocoding';
	
	// Shared state between components
	let address = $state("");
	let geocodingResult = $state<GeocodingResult | null>(null);
</script>

<div class="py-8">
	<div class="text-center mb-8">
		<h2 class="text-3xl font-bold mb-4">Calculate Your Space</h2>
		<p class="text-lg mb-6 max-w-2xl mx-auto">Welcome to the Square Footage App. Start measuring and managing your spaces efficiently.</p>
	</div>
	
	<div class="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6">
		<div class="lg:w-1/2">
			<AddressCalculator bind:address bind:geocodingResult />
		</div>
		<div class="lg:w-1/2">
			<PropertyMap geocodingResult={geocodingResult} />
		</div>
	</div>
</div>
