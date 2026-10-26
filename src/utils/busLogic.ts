import { BusRoute, BusStop, StopAlarmSettings } from '../types/bus';

/**
 * Calculates distance between two coordinates in kilometers using Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Calculates estimated minutes remaining to reach next stop
 */
export function calculateETA(
  distanceKm: number,
  speedKmH: number,
  additionalDelayMinutes: number = 0
): number {
  if (distanceKm <= 0.1) return 1;
  const effectiveSpeed = Math.max(speedKmH, 20); // assume minimum crawl speed in town
  const travelMinutes = Math.round((distanceKm / effectiveSpeed) * 60);
  return Math.max(1, travelMinutes + additionalDelayMinutes);
}

/**
 * Formats ETA string in Tamil and English
 * Example: "உங்க bus 8 நிமிடத்தில் Thoothukudi New Bus Stand வரும்"
 */
export function formatNextStopMessage(
  stopNameEn: string,
  stopNameTa: string,
  etaMinutes: number,
  lang: 'ta' | 'en'
): string {
  if (lang === 'ta') {
    return `உங்க bus ${etaMinutes} நிமிடத்தில் ${stopNameTa} வரும்`;
  }
  return `Your bus will arrive at ${stopNameEn} in ${etaMinutes} mins`;
}

/**
 * Determines whether destination alarm should trigger
 */
export function shouldAlarmTrigger(
  currentStopIndex: number,
  targetStopIndex: number,
  distanceToTargetKm: number,
  etaMinutesToTarget: number,
  alertBefore: StopAlarmSettings['alertBefore']
): boolean {
  if (targetStopIndex < 0 || currentStopIndex < 0) return false;
  if (currentStopIndex > targetStopIndex) return true; // already passed target

  switch (alertBefore) {
    case '1_stop':
      // Triggers if at target or immediate preceding stop
      return (targetStopIndex - currentStopIndex) <= 1;
    case '2_stops':
      // Triggers if 2 stops or closer
      return (targetStopIndex - currentStopIndex) <= 2;
    case '5_mins':
      // Triggers when ETA is 5 mins or fewer
      return etaMinutesToTarget <= 5;
    case '2_km':
      // Triggers when distance is 2.5 km or closer
      return distanceToTargetKm <= 2.5;
    default:
      return (targetStopIndex - currentStopIndex) <= 1;
  }
}

/**
 * Searches and filters buses by source and destination query
 */
export function searchBuses(
  buses: BusRoute[],
  fromQuery: string,
  toQuery: string,
  selectedType: string = 'All'
): BusRoute[] {
  const normFrom = fromQuery.trim().toLowerCase();
  const normTo = toQuery.trim().toLowerCase();

  return buses.filter((bus) => {
    // Match type
    if (selectedType !== 'All' && bus.busType !== selectedType) {
      return false;
    }

    if (!normFrom && !normTo) {
      return true;
    }

    // Match origin
    const fromMatch = !normFrom || 
      bus.fromCityEn.toLowerCase().includes(normFrom) ||
      bus.fromCityTa.toLowerCase().includes(normFrom) ||
      bus.stops.some(s => s.nameEn.toLowerCase().includes(normFrom) || s.nameTa.toLowerCase().includes(normFrom));

    // Match destination
    const toMatch = !normTo || 
      bus.toCityEn.toLowerCase().includes(normTo) ||
      bus.toCityTa.toLowerCase().includes(normTo) ||
      bus.stops.some(s => s.nameEn.toLowerCase().includes(normTo) || s.nameTa.toLowerCase().includes(normTo));

    return fromMatch && toMatch;
  });
}

/**
 * Calculates current progress along route (0 to 100)
 */
export function calculateRouteProgress(
  stops: BusStop[],
  currentStopIndex: number,
  subRatio: number = 0
): number {
  if (!stops || stops.length <= 1) return 0;
  const maxIdx = stops.length - 1;
  const clampedIdx = Math.max(0, Math.min(currentStopIndex, maxIdx));
  const baseFraction = clampedIdx / maxIdx;
  const segmentFraction = subRatio * (1 / maxIdx);
  const total = (baseFraction + segmentFraction) * 100;
  return Math.min(100, Math.round(total));
}

/**
 * Interpolates intermediate latitude & longitude
 */
export function interpolatePosition(
  pos1: { lat: number; lng: number },
  pos2: { lat: number; lng: number },
  ratio: number
): { lat: number; lng: number } {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return {
    lat: pos1.lat + (pos2.lat - pos1.lat) * clampedRatio,
    lng: pos1.lng + (pos2.lng - pos1.lng) * clampedRatio,
  };
}
