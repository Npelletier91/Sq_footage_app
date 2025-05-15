<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { Map as LeafletMap } from 'leaflet';
  import { createMap, addMarker, addPolygon } from '$lib/services/map';
  import type { GeocodingResult } from '$lib/services/geocoding';
  import type { Feature, Polygon, MultiPolygon } from 'geojson';
  
  // Props
  let { 
    geocodingResult = null,
    building = null,
    initialLat = 40.7128, 
    initialLng = -74.0060, 
    zoom = 13 
  } = $props();
  
  // Internal state
  let mapElement: HTMLElement;
  let map: LeafletMap | null = null;
  let marker: any = null;
  let polygonLayer: any = null;
  
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
  
  // Watch for changes to the building data
  $effect(() => {
    console.log("Building data changed:", building);
    if (map && building) {
      displayBuildingPolygon(building);
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
  
  // Function to display building polygon on the map
  function displayBuildingPolygon(feature: Feature<Polygon | MultiPolygon>) {
    if (!map) return;
    
    // Remove existing polygon if any
    if (polygonLayer) {
      polygonLayer.remove();
      polygonLayer = null;
    }
    
    try {
      // GeoJSON uses [longitude, latitude] format but Leaflet uses [latitude, longitude]
      // Need to swap coordinates for Leaflet
      if (feature.geometry.type === 'Polygon') {
        // Convert the first ring of coordinates (outer ring)
        const swappedCoords: [number, number][] = feature.geometry.coordinates[0].map(
          coord => [coord[1], coord[0]] as [number, number]
        );
        polygonLayer = addPolygon(map, swappedCoords);
      } else if (feature.geometry.type === 'MultiPolygon') {
        // Handle each polygon in the MultiPolygon separately
        feature.geometry.coordinates.forEach(poly => {
          const swappedCoords: [number, number][] = poly[0].map(
            coord => [coord[1], coord[0]] as [number, number]
          );
          if (!map) return; // Extra safety check
          const polyLayer = addPolygon(map, swappedCoords, {
            color: '#4ade80',
            fillColor: '#4ade80',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.3
          });
          
          if (!polygonLayer) polygonLayer = [polyLayer];
          else if (Array.isArray(polygonLayer)) polygonLayer.push(polyLayer);
        });
      }
      
      // Fit the map bounds to show the entire polygon
      if (!map) return; // Extra safety check
      if (polygonLayer && !Array.isArray(polygonLayer) && polygonLayer.getBounds) {
        map.fitBounds(polygonLayer.getBounds());
        // Zoom out to level 1 after a short delay to allow the bounds animation to complete
        setTimeout(() => {
          if (map) map.setZoom(18);
        }, 100);
      } else if (Array.isArray(polygonLayer) && polygonLayer.length > 0) {
        // Create bounds that include all polygons
        const bounds = polygonLayer[0].getBounds();
        for (let i = 1; i < polygonLayer.length; i++) {
          bounds.extend(polygonLayer[i].getBounds());
        }
        map.fitBounds(bounds);
        // Zoom out to level 1 after a short delay to allow the bounds animation to complete
        setTimeout(() => {
          if (map) map.setZoom(18);
        }, 100);
      }
    } catch (error) {
      console.error("Error displaying building polygon:", error);
    }
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