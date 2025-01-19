export interface Route {
  id: string;
  start_lat: number;
  start_lng: number;
  end_lat: number;
  end_lng: number;
  traffic_level: string;
  estimated_duration: number;
  weather_conditions: string;
}