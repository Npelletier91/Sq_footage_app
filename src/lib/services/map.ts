import type { Map as LeafletMap, LatLngExpression, Marker } from 'leaflet';
import { browser } from '$app/environment';

// This will store our loaded Leaflet library
let L: any;

/**
 * Initialize the Leaflet library and load CSS.
 */
export async function initLeaflet(): Promise<any> {
  if (!browser) return null;
  
  // Only load Leaflet once
  if (!L) {
    // Dynamically import Leaflet only in browser
    L = await import('leaflet');
    
    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
  
  return L;
}

/**
 * Create a new Leaflet map instance
 */
export async function createMap(element: HTMLElement, initialView: LatLngExpression = [40.7128, -74.0060], zoom: number = 13): Promise<LeafletMap | null> {
  const L = await initLeaflet();
  if (!L || !browser || !element) return null;
  
  // Create the map
  const map = L.map(element).setView(initialView, zoom);
  
  // Add default tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  
  return map;
}

/**
 * Add a marker to the map
 */
export function addMarker(map: LeafletMap, position: LatLngExpression, popupContent?: string): Marker {
  if (!L) throw new Error('Leaflet not initialized');
  
  const marker = L.marker(position).addTo(map);
  
  if (popupContent) {
    marker.bindPopup(popupContent).openPopup();
  }
  
  return marker;
}

/**
 * Add a polygon to the map
 * @param map The Leaflet map instance
 * @param coordinates An array of coordinates in the format expected by Leaflet
 * @param options Optional styling options for the polygon
 * @returns The created polygon object
 */
export function addPolygon(map: LeafletMap, coordinates: LatLngExpression[], options: any = {}): any {
  if (!L) throw new Error('Leaflet not initialized');
  
  // Default styling if not provided
  const defaultOptions = {
    color: '#3388ff',
    weight: 3,
    opacity: 0.7,
    fillColor: '#3388ff',
    fillOpacity: 0.2,
    ...options
  };
  
  const polygon = L.polygon(coordinates, defaultOptions).addTo(map);
  return polygon;
}