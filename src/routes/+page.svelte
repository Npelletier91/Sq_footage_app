<script lang="ts">
	import AddressCalculator from '../components/AddressInput.svelte';
	import LeafletMap from '../components/LeafletMap.svelte';
	import BuildingFootprintCalculator from '../components/BuildingFootprintCalculator.svelte';
	import type { GeocodingResult } from '$lib/services/geocoding';
	
	// Shared state between components
	let address = $state("");
	let geocodingResult = $state<GeocodingResult | null>(null);
	
	// Debug when geocodingResult changes
	$effect(() => {
		if (geocodingResult) {
			console.log("Page geocodingResult updated:", geocodingResult);
		}
	});
</script>

<div class="py-8">
	<div class="text-center mb-8">
		<h1 class="text-4xl font-bold mb-4">Square Footage App</h1>
		<p class="text-lg mb-6 max-w-2xl mx-auto">
			Calculate building perimeters and areas using precise building footprint data.
		</p>
	</div>
	
	<div class="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-6 mb-16">
		<div class="lg:w-1/2">
			<h2 class="text-2xl font-bold mb-4">Address Geocoding</h2>
			<AddressCalculator bind:address bind:geocodingResult />
		</div>
		<div class="lg:w-1/2">
			<h2 class="text-2xl font-bold mb-4">Map View</h2>
			<LeafletMap geocodingResult={geocodingResult} />
		</div>
	</div>
	
	<div class="max-w-7xl mx-auto px-4 mb-12 pt-8 border-t border-gray-200">
		<BuildingFootprintCalculator geocodingResult={geocodingResult} />
	</div>
</div>
