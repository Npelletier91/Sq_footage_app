<script lang="ts">
  import { findBuildingAtCoordinates, perimeterToFeet, areaToSquareFeet, isInAlaska, findNearbyBuildings } from '$lib/services/buildingFootprints';
  import type { GeocodingResult } from '$lib/services/geocoding';
  import * as turf from '@turf/turf';
  
  // Props
  let { geocodingResult = null } = $props<{
    geocodingResult: GeocodingResult | null;
  }>();
  
  // State
  let lat = $state(61.2181); // Default to Anchorage, Alaska
  let lng = $state(-149.9003);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let warning = $state<string | null>(null);
  let building = $state<any>(null);
  let nearbyBuildings = $state<any[]>([]);
  let perimeter = $state(0);
  let area = $state(0);
  let debugInfo = $state<string | null>(null);
  let searchRadius = $state(50); // Default 50 meters
  
  // Update coordinates when geocoding result changes
  $effect(() => {
    if (geocodingResult) {
      lat = geocodingResult.lat;
      lng = geocodingResult.lng;
    }
  });
  
  // Check if coordinates are in Alaska whenever they change
  $effect(() => {
    warning = isInAlaska(lat, lng) ? null : "Warning: These coordinates are outside Alaska's bounds.";
  });
  
  async function findBuilding() {
    loading = true;
    error = null;
    building = null;
    nearbyBuildings = [];
    debugInfo = null;
    
    // Check Alaska bounds
    if (!isInAlaska(lat, lng)) {
      warning = "Warning: These coordinates are outside Alaska's bounds.";
    } else {
      warning = null;
    }
    
    const geojsonPath = '/building-footprints/Alaska.geojson';
    debugInfo = `Attempting to fetch: ${geojsonPath}`;
    debugInfo += ` | Searching for point at [${lng}, ${lat}]`;
    
    try {
      const result = await findBuildingAtCoordinates(lat, lng, geojsonPath);
      
      if (result) {
        building = result.feature;
        perimeter = perimeterToFeet(result.perimeter);
        area = areaToSquareFeet(result.area);
      } else {
        error = "No building found at these coordinates";
        // Automatically search for nearby buildings when no exact match is found
        findNearby();
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      error = `Error: ${errorMessage}`;
      console.error("Building footprint error:", e);
    } finally {
      loading = false;
    }
  }
  
  async function findNearby() {
    if (loading) return;
    
    loading = true;
    debugInfo = `Searching for buildings within ${searchRadius}m of [${lng}, ${lat}]`;
    
    try {
      nearbyBuildings = await findNearbyBuildings(lat, lng, searchRadius);
      
      if (nearbyBuildings.length === 0) {
        warning = `No buildings found within ${searchRadius} meters`;
      } else {
        warning = `Found ${nearbyBuildings.length} buildings nearby. Closest is ${nearbyBuildings[0].distance.toFixed(2)}m away.`;
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      error = `Error finding nearby buildings: ${errorMessage}`;
    } finally {
      loading = false;
    }
  }
  
  async function selectNearbyBuilding(nearbyBuilding: any) {
    building = nearbyBuilding.feature;
    perimeter = perimeterToFeet(calculatePerimeter(nearbyBuilding.feature));
    area = areaToSquareFeet(calculateArea(nearbyBuilding.feature));
    error = null;
  }
  
  function calculatePerimeter(feature: any): number {
    // This is a simplified version of the function in buildingFootprints.ts
    try {
      if (feature.geometry.type === 'Polygon') {
        const line = turf.lineString(feature.geometry.coordinates[0]);
        return turf.length(line, { units: 'meters' });
      } else if (feature.geometry.type === 'MultiPolygon') {
        let totalPerimeter = 0;
        for (const polygonCoords of feature.geometry.coordinates) {
          const line = turf.lineString(polygonCoords[0]);
          totalPerimeter += turf.length(line, { units: 'meters' });
        }
        return totalPerimeter;
      }
      return 0;
    } catch (e) {
      console.error("Error calculating perimeter:", e);
      return 0;
    }
  }
  
  function calculateArea(feature: any): number {
    try {
      return turf.area(feature);
    } catch (e) {
      console.error("Error calculating area:", e);
      return 0;
    }
  }
  
  async function testGeoJsonAccess() {
    loading = true;
    error = null;
    debugInfo = "Testing GeoJSON file access...";
    
    const geojsonPath = '/building-footprints/Alaska.geojson';
    
    try {
      const response = await fetch(geojsonPath);
      if (!response.ok) {
        error = `Failed to access GeoJSON file: ${response.status} ${response.statusText}`;
      } else {
        debugInfo = `GeoJSON file accessible! Status: ${response.status}`;
        const data = await response.json();
        debugInfo += ` | Found ${data.features?.length || 0} features`;
        
        // Examine sample feature structure
        if (data.features?.[0]) {
          const sample = data.features[0];
          console.log('Sample feature:', sample);
          
          let coordSample;
          if (sample.geometry.type === 'Polygon') {
            coordSample = sample.geometry.coordinates[0][0];
          } else if (sample.geometry.type === 'MultiPolygon') {
            coordSample = sample.geometry.coordinates[0][0][0];
          }
          
          debugInfo += ` | Sample coordinate: ${JSON.stringify(coordSample)}`;
          debugInfo += ` | Geometry type: ${sample.geometry.type}`;
        }
      }
    } catch (e) {
      error = `Error accessing GeoJSON: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      loading = false;
    }
  }
</script>

<div>
  <h2 class="text-2xl font-bold mb-4">Building Footprint Calculator</h2>
  <p class="mb-4">Find building footprints and calculate perimeter and area based on coordinates.</p>
  
  <div class="bg-white p-6 rounded-lg shadow-md mb-6">
    <div class="mb-4">
      <div class="flex gap-4 mb-2">
        <div>
          <label for="lat" class="block text-sm font-medium">Latitude</label>
          <input 
            id="lat" 
            type="number" 
            bind:value={lat} 
            step="0.0001"
            class="border rounded px-2 py-1"
          />
        </div>
        
        <div>
          <label for="lng" class="block text-sm font-medium">Longitude</label>
          <input 
            id="lng" 
            type="number" 
            bind:value={lng} 
            step="0.0001"
            class="border rounded px-2 py-1"
          />
        </div>
        
        <div>
          <label for="radius" class="block text-sm font-medium">Search Radius (m)</label>
          <input 
            id="radius" 
            type="number" 
            bind:value={searchRadius} 
            min="10"
            max="1000"
            step="10"
            class="border rounded px-2 py-1"
          />
        </div>
      </div>
      
      <div class="flex flex-wrap gap-2">
        <button 
          onclick={findBuilding}
          disabled={loading}
          class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? 'Searching...' : 'Find Building'}
        </button>
        
        <button 
          onclick={findNearby}
          disabled={loading}
          class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Find Nearby Buildings
        </button>
        
        <button 
          onclick={testGeoJsonAccess}
          disabled={loading}
          class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
        >
          Test GeoJSON Access
        </button>
        
        {#if geocodingResult}
          <button 
            onclick={findBuilding}
            disabled={loading}
            class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
          >
            Use Geocoded Coordinates
          </button>
        {/if}
      </div>
    </div>
    
    {#if warning}
      <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
        {warning}
      </div>
    {/if}
    
    {#if debugInfo}
      <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 text-sm">
        <strong>Debug:</strong> {debugInfo}
      </div>
    {/if}
    
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    {/if}
    
    {#if nearbyBuildings.length > 0}
      <div class="mt-4 mb-4">
        <h3 class="font-bold mb-2">Nearby Buildings:</h3>
        <div class="bg-gray-50 p-3 rounded border">
          <ul class="divide-y">
            {#each nearbyBuildings as nearby, i}
              {#if i < 5} <!-- Limit display to 5 buildings -->
                <li class="py-2">
                  <div class="flex justify-between items-center">
                    <div>
                      <span class="font-medium">Building {i+1}</span>
                      <span class="ml-2 text-sm text-gray-600">{nearby.distance.toFixed(2)}m away</span>
                    </div>
                    <button
                      onclick={() => selectNearbyBuilding(nearby)}
                      class="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Select
                    </button>
                  </div>
                </li>
              {/if}
            {/each}
            {#if nearbyBuildings.length > 5}
              <li class="py-2 text-center text-gray-500">
                + {nearbyBuildings.length - 5} more buildings
              </li>
            {/if}
          </ul>
        </div>
      </div>
    {/if}
    
    {#if building}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        <h3 class="font-bold">Building Found!</h3>
        <p>Perimeter: {perimeter.toFixed(2)} feet</p>
        <p>Area: {area.toFixed(2)} square feet</p>
      </div>
      
      <div class="mt-4">
        <h3 class="font-bold">Building Properties:</h3>
        <div class="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          <pre>{JSON.stringify(building.properties, null, 2)}</pre>
        </div>
      </div>
    {/if}
  </div>
</div>