import { useRef, useEffect } from 'react';
import L from 'leaflet';

export const useMapInstance = (containerId: string) => {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Cleanup existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    // Initialize map with a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        mapRef.current = L.map(container, {
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapRef.current);

        // Set initial view
        mapRef.current.setView([51.505, -0.09], 13);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [containerId]);

  return mapRef.current;
};