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
    console.log("Geocoding result changed:", geocodingResult);
    if (map && geocodingResult) {
      updateMapWithResult(geocodingResult);
    }
  });
  
  // Function to update the map with a geocoding result
  function updateMapWithResult(result: GeocodingResult) {
    if (!map) return;
    
    console.log("Updating map with coordinates:", result.lat, result.lng);
    
    // Clear previous marker
    if (marker) marker.remove();
    
    // Center map on the result with animation
    map.setView([result.lat, result.lng], 16, {
      animate: true,
      duration: 0.5
    });
    
    // Add a marker with enhanced popup
    const popupContent = `
      <div class="font-medium">
        <b>${result.address}</b>
        <div class="text-xs text-gray-500 mt-1">
          Lat: ${result.lat.toFixed(6)}, Lng: ${result.lng.toFixed(6)}
        </div>
      </div>
    `;
    
    marker = addMarker(map, [result.lat, result.lng], popupContent);
    
    // Ensure the marker is visible
    marker.openPopup();
  }
</script>

<div class="bg-gray-100 p-6 rounded-lg shadow-md flex flex-col h-[500px]">
  <h3 class="text-xl font-semibold mb-4">Map</h3>
  
  <div 
    bind:this={mapElement}
    class="h-[400px] rounded-md border border-gray-300 z-0" 
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