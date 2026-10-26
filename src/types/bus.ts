export type BusType = 
  | 'SETC Ultra Deluxe'
  | 'SETC AC Sleeper'
  | 'Point-to-Point Express'
  | '1 to 1 Non Stop'
  | 'TNSTC Deluxe'
  | 'TNSTC Ordinary';

export interface BusStop {
  id: string;
  nameEn: string;
  nameTa: string;
  lat: number;
  lng: number;
  scheduledTime: string; // e.g. "08:15 AM"
  estimatedTime?: string;
  distanceFromStartKm: number;
}

export interface CrowdsourceReport {
  id: string;
  busId: string;
  author: string;
  seatInfo?: string;
  category: 'traffic' | 'breakdown' | 'crowd' | 'ac_fan' | 'diversion' | 'driver' | 'general';
  messageEn: string;
  messageTa: string;
  timestamp: string; // ISO or human format
  upvotes: number;
  hasUserUpvoted?: boolean;
  stopNameEn?: string;
  stopNameTa?: string;
}

export interface DelayAlert {
  id: string;
  busId: string;
  severity: 'low' | 'medium' | 'high';
  type: 'delay' | 'breakdown' | 'traffic' | 'diversion' | 'weather';
  delayMinutes: number;
  titleEn: string;
  titleTa: string;
  descriptionEn: string;
  descriptionTa: string;
  reportedAt: string;
  resolved: boolean;
}

export interface BusRoute {
  id: string;
  routeNumber: string; // e.g. "111-EXP", "SETC 214", "1-TO-1"
  busNumberPlate: string; // e.g. "TN 72 N 2489"
  depot: string; // e.g. "Thoothukudi Mofussil", "Tirunelveli Bypass"
  fromCityEn: string;
  fromCityTa: string;
  toCityEn: string;
  toCityTa: string;
  departureTime: string; // e.g. "08:00 AM"
  arrivalTime: string; // e.g. "09:30 AM"
  durationMinutes: number;
  busType: BusType;
  fare: number;
  frequency: string; // e.g. "Every 15 mins"
  stops: BusStop[];
  currentLocation: {
    lat: number;
    lng: number;
    speedKmH: number;
    heading: number;
    lastUpdated: string;
  };
  currentStopIndex: number;
  progressPercent: number; // 0 to 100
  delayMinutes: number; // 0 = on time, >0 = delayed
  crowdsourceReports: CrowdsourceReport[];
  delayAlerts: DelayAlert[];
  isTrackingLive: boolean;
}

export interface StopAlarmSettings {
  enabled: boolean;
  busId: string;
  busRouteNumber: string;
  targetStopId: string;
  targetStopNameEn: string;
  targetStopNameTa: string;
  alertBefore: '1_stop' | '2_stops' | '5_mins' | '2_km';
  sound: 'horn' | 'chime' | 'train' | 'bell';
  volume: number;
  vibrate: boolean;
}
