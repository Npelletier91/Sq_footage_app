import * as turf from '@turf/turf';
import type { GeocodingResult } from './geocoding';

// Define types based on GeoJSON specification
type Position = number[];
type Polygon = {
  type: 'Polygon';
  coordinates: Position[][];
};
type MultiPolygon = {
  type: 'MultiPolygon';
  coordinates: Position[][][];
};
type Feature<G> = {
  type: 'Feature';
  geometry: G;
  properties: Record<string, any>;
};

// Define Alaska bounding box (approximate)
const ALASKA_BOUNDS = {
  west: -180,  // Westernmost longitude 
  east: -130,  // Easternmost longitude
  south: 51,   // Southernmost latitude
  north: 72    // Northernmost latitude
};

export interface BuildingMatch {
  feature: Feature<Polygon | MultiPolygon>;
  perimeter: number;
  area: number;
}

/**
 * Check if coordinates are within Alaska's bounds
 * @param lat Latitude
 * @param lng Longitude
 * @returns Whether the coordinates are within Alaska
 */
export function isInAlaska(lat: number, lng: number): boolean {
  return lng >= ALASKA_BOUNDS.west && 
         lng <= ALASKA_BOUNDS.east && 
         lat >= ALASKA_BOUNDS.south && 
         lat <= ALASKA_BOUNDS.north;
}

/**
 * Find a building polygon that contains the given coordinates
 * @param lat Latitude of the point
 * @param lng Longitude of the point
 * @param geojsonPath Path to the GeoJSON file containing building footprints
 * @returns The matching building feature with calculated perimeter and area, or null if no match
 */
export async function findBuildingAtCoordinates(
  lat: number, 
  lng: number, 
  geojsonPath: string = '/building-footprints/Alaska.geojson'
): Promise<BuildingMatch | null> {
  try {
    // Check if coordinates are within Alaska first
    if (!isInAlaska(lat, lng)) {
      console.warn(`Coordinates [${lng}, ${lat}] are outside Alaska's bounds`);
    }
    
    // Create a point from the coordinates
    // IMPORTANT: GeoJSON uses [longitude, latitude] order
    const userPoint = turf.point([lng, lat]);
    
    // Fetch the GeoJSON file
    const response = await fetch(geojsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    
    // Parse the GeoJSON data
    const geojson = await response.json();
    
    // Log some debug info
    console.log(`GeoJSON features count: ${geojson.features?.length || 0}`);
    console.log(`Searching for point at [${lng}, ${lat}]`);
    
    if (!geojson.features || geojson.features.length === 0) {
      throw new Error('GeoJSON contains no features');
    }
    
    // Find the first building polygon that contains the point
    const matchedFeature = geojson.features.find((feature: Feature<Polygon | MultiPolygon>) => {
      try {
        return turf.booleanPointInPolygon(userPoint, feature);
      } catch (err) {
        console.error('Error checking point in polygon:', err);
        return false;
      }
    });
    
    // If no exact match found, try to find the closest building
    if (!matchedFeature) {
      console.log('No exact match found, looking for nearby buildings...');
      
      // Find buildings within ~50 meters (~0.0005 degrees)
      const searchRadius = 0.0005;
      const nearbyBuildings: {feature: Feature<Polygon | MultiPolygon>, distance: number}[] = [];
      
      for (const feature of geojson.features) {
        try {
          // For polygons, we can try to find the closest point on the polygon
          const polygon = feature.geometry.type === 'Polygon' 
            ? turf.polygon(feature.geometry.coordinates)
            : turf.multiPolygon(feature.geometry.coordinates);
          
          // Use pointOnFeature instead of nearestPointOnFeature
          const pointOnPolygon = turf.pointOnFeature(polygon);
          if (pointOnPolygon) {
            const distance = turf.distance(userPoint, pointOnPolygon, {units: 'meters'});
            if (distance < 50) { // Within 50 meters
              nearbyBuildings.push({feature, distance});
            }
          }
        } catch (err) {
          continue; // Skip any problematic features
        }
      }
      
      // Sort by distance and take the closest
      nearbyBuildings.sort((a, b) => a.distance - b.distance);
      
      if (nearbyBuildings.length > 0) {
        console.log(`Found ${nearbyBuildings.length} nearby buildings. Closest is ${nearbyBuildings[0].distance.toFixed(2)}m away.`);
        // For now, we'll still return null since this function should find exact matches
        // But we have the information to implement a "nearby buildings" feature later
      } else {
        console.log('No nearby buildings found within 50 meters.');
      }
      
      return null;
    }
    
    // Calculate perimeter and area
    const perimeter = calculatePerimeter(matchedFeature);
    const area = turf.area(matchedFeature);
    
    return {
      feature: matchedFeature,
      perimeter,
      area
    };
  } catch (error) {
    console.error('Error finding building:', error);
    throw error; // Throw the error instead of returning null
  }
}

/**
 * Find a building based on geocoding result
 * @param geocodingResult The result from geocoding service
 * @param geojsonPath Path to the GeoJSON file
 * @returns The matching building with calculated metrics, or null if no match
 */
export async function findBuildingFromGeocode(
  geocodingResult: GeocodingResult, 
  geojsonPath: string = '/building-footprints/Alaska.geojson'
): Promise<BuildingMatch | null> {
  return findBuildingAtCoordinates(
    geocodingResult.lat, 
    geocodingResult.lng, 
    geojsonPath
  );
}

/**
 * Calculate the perimeter of a polygon feature
 * @param feature The GeoJSON feature (Polygon or MultiPolygon)
 * @returns The perimeter length in meters
 */
function calculatePerimeter(feature: Feature<Polygon | MultiPolygon>): number {
  if (feature.geometry.type === 'Polygon') {
    // For a simple polygon, calculate the perimeter of the outer ring
    const line = turf.lineString(feature.geometry.coordinates[0]);
    return turf.length(line, { units: 'meters' });
  } else if (feature.geometry.type === 'MultiPolygon') {
    // For a multi-polygon, sum the perimeters of all polygons
    let totalPerimeter = 0;
    for (const polygonCoords of feature.geometry.coordinates) {
      const line = turf.lineString(polygonCoords[0]);
      totalPerimeter += turf.length(line, { units: 'meters' });
    }
    return totalPerimeter;
  }
  
  return 0;
}

/**
 * Convert perimeter from meters to feet
 * @param meters Perimeter in meters
 * @returns Perimeter in feet
 */
export function perimeterToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Convert area from square meters to square feet
 * @param squareMeters Area in square meters
 * @returns Area in square feet
 */
export function areaToSquareFeet(squareMeters: number): number {
  return squareMeters * 10.7639;
}

/**
 * Find buildings near the specified coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusMeters Search radius in meters
 * @param geojsonPath Path to the GeoJSON file
 * @returns List of nearby buildings with distances
 */
export async function findNearbyBuildings(
  lat: number,
  lng: number,
  radiusMeters: number = 50,
  geojsonPath: string = '/building-footprints/Alaska.geojson'
): Promise<{feature: Feature<Polygon | MultiPolygon>, distance: number}[]> {
  try {
    // Create a point from the coordinates
    const userPoint = turf.point([lng, lat]);
    
    // Fetch the GeoJSON file
    const response = await fetch(geojsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    }
    
    // Parse the GeoJSON data
    const geojson = await response.json();
    
    if (!geojson.features || geojson.features.length === 0) {
      throw new Error('GeoJSON contains no features');
    }
    
    // Sample some features to examine their structure
    const sampleFeature = geojson.features[0];
    console.log('Sample GeoJSON feature structure:', {
      type: sampleFeature.type,
      geometryType: sampleFeature.geometry.type,
      coordinateDepth: getCoordinateDepth(sampleFeature.geometry.coordinates),
      firstCoordinate: getFirstCoordinate(sampleFeature.geometry.coordinates)
    });
    
    // Find nearby buildings
    const nearbyBuildings: {feature: Feature<Polygon | MultiPolygon>, distance: number}[] = [];
    
    for (const feature of geojson.features) {
      try {
        // For polygons, we can try to find a point on the polygon
        const polygon = feature.geometry.type === 'Polygon' 
          ? turf.polygon(feature.geometry.coordinates)
          : turf.multiPolygon(feature.geometry.coordinates);
        
        const pointOnPolygon = turf.pointOnFeature(polygon);
        if (pointOnPolygon) {
          const distance = turf.distance(userPoint, pointOnPolygon, {units: 'meters'});
          if (distance < radiusMeters) {
            nearbyBuildings.push({feature, distance});
          }
        }
      } catch (err) {
        continue; // Skip any problematic features
      }
    }
    
    // Sort by distance
    return nearbyBuildings.sort((a, b) => a.distance - b.distance);
  } catch (error) {
    console.error('Error finding nearby buildings:', error);
    throw error;
  }
}

/**
 * Get the depth of nested coordinates arrays
 */
function getCoordinateDepth(coords: any): number {
  if (!Array.isArray(coords)) return 0;
  if (coords.length === 0) return 1;
  if (typeof coords[0] === 'number') return 1;
  return 1 + getCoordinateDepth(coords[0]);
}

/**
 * Get the first actual coordinate pair from a nested structure
 */
function getFirstCoordinate(coords: any): number[] | null {
  if (!Array.isArray(coords)) return null;
  if (coords.length === 0) return null;
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') return [coords[0], coords[1]];
  return getFirstCoordinate(coords[0]);
} 