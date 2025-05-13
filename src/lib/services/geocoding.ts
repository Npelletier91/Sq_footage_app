import { browser } from '$app/environment';

/**
 * Simple location result interface
 */
export interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
}

/**
 * Generate a random location for any address input
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!browser) {
    throw new Error('Geocoding can only be performed in the browser');
  }
  
  // Generate a random location within NYC area
  const randomOffset = () => (Math.random() - 0.5) * 0.05;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    address,
    lat: 40.7128 + randomOffset(), // Random offset from NYC
    lng: -74.0060 + randomOffset()
  };
} 