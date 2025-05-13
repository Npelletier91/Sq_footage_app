<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map as LeafletMap } from 'leaflet';
  import { createMap, addMarker } from '$lib/services/map';
  import type { GeocodingResult } from '$lib/services/geocoding';
  
  // Props
  let { 
    geocodingResult = null,
    initialLat = 40.7128, 
    initialLng = -74.0060, 
    zoom = 13 
  } = $props();
  
  // Internal state
  let mapElement: HTMLElement;
  let map: LeafletMap | null = null;
  let marker: any = null;
  
  onMount(async () => {
    // Initialize the map on mount
    map = await createMap(mapElement, [initialLat, initialLng], zoom);
  });
  
  onDestroy(() => {
    // Clean up the map when component is destroyed
    if (map) {
      map.remove();
      map = null;
    }
  });
  
  // Watch for changes to the geocoding result
  $effect(() => {
    if (map && geocodingResult) {
      updateMapWithResult(geocodingResult);
    }
  });
  
  // Function to update the map with a geocoding result
  function updateMapWithResult(result: GeocodingResult) {
    if (!map) return;
    
    // Clear previous marker
    if (marker) marker.remove();
    
    // Center map on the result
    map.setView([result.lat, result.lng], 16);
    
    // Add a marker
    const popupContent = `<b>${result.address}</b>`;
    marker = addMarker(map, [result.lat, result.lng], popupContent);
  }
</script>

<div class="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col h-full">
  <h3 class="text-xl font-semibold mb-4">Property Map</h3>
  
  <div 
    bind:this={mapElement}
    class="flex-grow rounded-md border border-gray-300 min-h-[300px] z-0" 
  ></div>
</div>

<style>
  /* Make sure the map container has a defined height */
  :global(.leaflet-container) {
    height: 100%;
    width: 100%;
    z-index: 0;
  }
</style> 