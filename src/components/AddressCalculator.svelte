<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	
	// Import type only, not the actual module
	import type { Map as LeafletMap, LatLngTuple } from 'leaflet';
	
	let address = "";
	let squareFootage: number | null = null;
	let calculationComplete = false;
	let map: LeafletMap | null = null;
	let mapElement: HTMLElement;
	let L: any;
	
	onMount(async () => {
		if (browser) {
			// Dynamically import Leaflet only in the browser
			L = await import('leaflet');
			
			// Manually import the CSS
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);
			
			// Initialize map with default view
			initMap();
		}
	});
	
	function initMap() {
		// Make sure we're in browser environment and the element exists
		if (browser && mapElement && L) {
			// Create map instance if it doesn't exist
			if (!map) {
				map = L.map(mapElement).setView([40.7128, -74.0060], 13); // Default to NYC
				
				// Add the OpenStreetMap tiles
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '© OpenStreetMap contributors'
				}).addTo(map);
			}
		}
	}
	
	function calculateArea() {		
		// Simulate a calculation with a random number
		setTimeout(() => {
			squareFootage = Math.floor(Math.random() * 3000) + 1000;
			calculationComplete = true;

			if (browser && map && L) {
				// Simulating new location with slight offset
				const lat = 40.7128 + (Math.random() - 0.5) * 0.05;
				const lng = -74.0060 + (Math.random() - 0.5) * 0.05;
				
				map.setView([lat, lng], 16);
				
				// Add a marker at the "found" location
				L.marker([lat, lng])
					.addTo(map)
					.bindPopup(`<b>${address}</b><br>${squareFootage} sq ft`).openPopup();
				
				// Simulated property boundary (polygon)
				const points: LatLngTuple[] = [
					[lat - 0.001, lng - 0.001],
					[lat + 0.001, lng - 0.001],
					[lat + 0.001, lng + 0.001],
					[lat - 0.001, lng + 0.001]
				];
				
				L.polygon(points, {color: 'blue', fillColor: '#aaf', fillOpacity: 0.5})
					.addTo(map);
			}
		}, 500);
	}
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
	<!-- Address Input Section -->
	<div class="bg-white p-6 rounded-lg shadow-md">
		<h3 class="text-xl font-semibold mb-4">Enter Property Address</h3>
		
		<div class="mb-4">
			<label for="address" class="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
			<input 
				type="text" 
				id="address" 
				bind:value={address} 
				class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
				placeholder="123 Main St, City, State, ZIP"
			/>
		</div>
		
		<button 
			onclick={calculateArea}
			class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-150 ease-in-out"
			disabled={address.trim() === ""}
		>
			Calculate Square Footage
		</button>
	</div>
	
	<!-- Map Placeholder -->
	<div class="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col">
		<h3 class="text-xl font-semibold mb-4">Property Map</h3>
		
		<div 
			bind:this={mapElement}
			class="flex-grow rounded-md border border-gray-300 min-h-[300px] z-0" 
		></div>
	</div>
</div>

<!-- Results Section - Only appears after calculation -->
{#if calculationComplete}
	<div class="mt-8 bg-green-50 border border-green-200 rounded-lg shadow-md p-6 animate-fade-in">
		<h3 class="text-xl font-semibold mb-2 text-green-800">Calculation Results</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div>
				<p class="text-gray-700 mb-2"><strong>Address:</strong> {address}</p>
				<p class="text-gray-700"><strong>Calculated Square Footage:</strong> {squareFootage?.toLocaleString() ?? 0} sq ft</p>
			</div>
			<div class="bg-white p-4 rounded-md border border-gray-200">
				<h4 class="font-medium text-gray-700 mb-2">Additional Information</h4>
				<ul class="text-sm text-gray-600 space-y-1">
					<li>• Calculation based on property boundaries</li>
					<li>• Results may vary from official records</li>
				</ul>
			</div>
		</div>
	</div>
{/if}

<style>
	.animate-fade-in {
		animation: fadeIn 0.5s ease-in-out;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(10px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	/* Make sure the map container has a defined height */
	:global(.leaflet-container) {
		height: 100%;
		width: 100%;
		z-index: 0;
	}
</style> 