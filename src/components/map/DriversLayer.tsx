import L from 'leaflet';
import { useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

type DriverUpdate = Database['public']['Tables']['drivers']['Row'];

interface DriversLayerProps {
  map: L.Map;
}

const DriversLayer = ({ map }: DriversLayerProps) => {
  useEffect(() => {
    if (!map) return;

    const markers: { [key: string]: L.Marker } = {};
    
    const channel = supabase
      .channel('drivers-location')
      .on<DriverUpdate>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers'
        },
        (payload) => {
          const driver = payload.new as DriverUpdate;
          
          if (!driver || !driver.id || typeof driver.current_lat !== 'number' || typeof driver.current_lng !== 'number') {
            console.warn('Invalid driver data received:', driver);
            return;
          }

          if (markers[driver.id]) {
            markers[driver.id].setLatLng([driver.current_lat, driver.current_lng]);
          } else {
            const driverIcon = L.divIcon({
              className: 'driver-marker',
              html: `<div style="width: 20px; height: 20px; border-radius: 50%; background-color: #4CAF50; border: 2px solid white;"></div>`,
              iconSize: [20, 20]
            });

            markers[driver.id] = L.marker([driver.current_lat, driver.current_lng], {
              icon: driverIcon
            }).addTo(map);
          }
        }
      )
      .subscribe();

    return () => {
      // Cleanup markers
      Object.values(markers).forEach(marker => marker.remove());
      
      // Unsubscribe from channel
      supabase.removeChannel(channel);
    };
  }, [map]);

  return null;
};

export default DriversLayer;