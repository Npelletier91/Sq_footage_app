<script lang="ts">
	import { geocodeAddress } from '$lib/services/geocoding';
	import type { GeocodingResult } from '$lib/services/geocoding';
	import type { Feature, Polygon, MultiPolygon } from 'geojson';
	
	// Props
	let { 
		address = $bindable(""),
		geocodingResult = $bindable<GeocodingResult | null>(null),
		building = $bindable<Feature<Polygon | MultiPolygon> | null>(null)
	} = $props();
	
	// Local state
	let loading = $state(false);
	
	async function calculateEstimate() {
		if (!address.trim()) return;
		
		loading = true;
		
		try {
			// Clear previous building data
			building = null;
			
			// Get geocoding result for the address
			const result = await geocodeAddress(address);
			
			console.log("Geocoding API result:", result);
			
			// Update geocodingResult immediately to trigger map update
			geocodingResult = result;
			
			console.log("Updated geocodingResult:", geocodingResult);
			
			// Simulate API call with timeout for square footage
			setTimeout(() => {
				// Generate random square footage between 1000 and 5000
				loading = false;
			}, 800);
		} catch (error) {
			console.error('Error geocoding address:', error);
			loading = false;
		}
	}
</script>

<div class="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
	<h3 class="text-xl font-semibold mb-4">Enter Property Address</h3>
	
	<div class="mb-4">
		<label for="address" class="block text-sm font-medium text-gray-700 mb-1">Address</label>
		<input 
			type="text" 
			id="address" 
			bind:value={address} 
			class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
			placeholder="Enter any address"
			disabled={loading}
		/>
	</div>
	
	<button 
		onclick={calculateEstimate}
		class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out {loading ? 'opacity-75 cursor-not-allowed' : ''}"
		disabled={address.trim() === "" || loading}
	>
		{loading ? 'Calculating...' : 'Get Geocoding Data'}
	</button>
	
	<!-- Results Section -->
	<div class="mt-6 flex-grow">
		<h3 class="text-xl font-semibold mb-4">Geocoding Results</h3>
		
		{#if loading}
			<div class="flex justify-center items-center h-40">
				<p class="text-gray-500">Fetching geocoding data...</p>
			</div>
		{:else if geocodingResult}
			<div class="space-y-4">
				<div class="p-4 bg-gray-50 rounded-md">
					<p class="text-sm text-gray-500">Property Address</p>
					<p class="font-medium">{address}</p>
				</div>
				
				<div class="p-4 bg-gray-50 rounded-md">
					<p class="text-sm text-gray-500">Coordinates</p>
					<p class="font-medium">Latitude: {geocodingResult.lat.toFixed(6)}</p>
					<p class="font-medium">Longitude: {geocodingResult.lng.toFixed(6)}</p>
				</div>
				
				<!-- Raw JSON Response -->
				<div class="p-4 bg-gray-50 rounded-md">
					<p class="text-sm text-gray-500 mb-2">Raw JSON Response</p>
					<pre class="text-xs bg-gray-900 text-white p-3 rounded-md overflow-x-auto">{JSON.stringify(geocodingResult.rawResponse, null, 2)}</pre>
				</div>

			</div>
		{:else}
			<div class="flex justify-center items-center h-40 text-center">
				<p class="text-gray-500">Enter an address and click "Get Geocoding Data" to see property information</p>
			</div>
		{/if}
	</div>
</div>

<style>
	/* Any component-specific styles can go here */
</style> 