export interface MapLocation {
  lat: number;
  lng: number;
  type: 'start' | 'end';
  onMove?: (lat: number, lng: number) => void;
}

export interface TrafficUpdate {
  location: {
    lat: number;
    lng: number;
  };
  type: string;
  severity: string;
  description: string;
}

export interface RouteOptimization {
  status: string;
  start: MapLocation;
  end: MapLocation;
  optimization?: any;
}