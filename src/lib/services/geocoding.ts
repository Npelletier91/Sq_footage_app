import { PUBLIC_GEOCODE_API_KEY } from '$env/static/public';
import { browser } from '$app/environment';

/**
 * Simple location result interface
 */
export interface GeocodingResult {
  address: string;
  lat: number;
  lng: number;
  rawResponse?: any; // Store the raw API response for debugging
}

// API key from environment variables
const API_KEY = PUBLIC_GEOCODE_API_KEY;


export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  if (!browser) {
    throw new Error('Geocoding can only be performed in the browser');
  }

  if (!API_KEY) {
    throw new Error('Geocoding API key is not defined. Please check your environment variables.');
  }

  try {
    // URL-encode the address and create the API URL
    const encodedAddress = encodeURIComponent(address);
    const url = `https://geocode.maps.co/search?q=${encodedAddress}&api_key=${API_KEY}`;

    // Make the API call
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check if we got any results
    if (!data || data.length === 0) {
      throw new Error('No results found for this address');
    }
    
    // Use the first result
    const result = data[0];
    
    return {
      address,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      rawResponse: data
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    throw error;
  }
} 