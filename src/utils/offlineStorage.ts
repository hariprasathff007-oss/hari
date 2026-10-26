import { BusRoute, CrowdsourceReport, StopAlarmSettings } from '../types/bus';

const TIMETABLE_CACHE_KEY = 'tn_bus_timetable_cache_v1';
const CROWD_REPORTS_KEY = 'tn_bus_crowdsource_reports_v1';
const STOP_ALARM_KEY = 'tn_bus_active_stop_alarm_v1';
const LAST_SYNC_KEY = 'tn_bus_last_cache_sync_v1';

export interface CacheMetadata {
  isCached: boolean;
  lastUpdated: string;
  totalRoutes: number;
  totalBuses: number;
  sizeKb: number;
}

export function saveTimetableToCache(routes: BusRoute[]): void {
  try {
    const serialized = JSON.stringify(routes);
    localStorage.setItem(TIMETABLE_CACHE_KEY, serialized);
    localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  } catch (err) {
    console.error('Failed to save timetable to cache:', err);
  }
}

export function loadTimetableFromCache(): BusRoute[] | null {
  try {
    const raw = localStorage.getItem(TIMETABLE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load timetable from cache:', err);
    return null;
  }
}

export function getCacheMetadata(currentRoutes: BusRoute[]): CacheMetadata {
  try {
    const raw = localStorage.getItem(TIMETABLE_CACHE_KEY);
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (!raw) {
      // Auto cache if not present
      saveTimetableToCache(currentRoutes);
      return {
        isCached: true,
        lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        totalRoutes: currentRoutes.length,
        totalBuses: currentRoutes.length,
        sizeKb: Math.round(JSON.stringify(currentRoutes).length / 1024),
      };
    }

    return {
      isCached: true,
      lastUpdated: lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
      totalRoutes: currentRoutes.length,
      totalBuses: currentRoutes.length,
      sizeKb: Math.round(raw.length / 1024),
    };
  } catch {
    return {
      isCached: false,
      lastUpdated: 'Never',
      totalRoutes: 0,
      totalBuses: 0,
      sizeKb: 0,
    };
  }
}

export function saveAlarmSettings(alarm: StopAlarmSettings | null): void {
  try {
    if (alarm) {
      localStorage.setItem(STOP_ALARM_KEY, JSON.stringify(alarm));
    } else {
      localStorage.removeItem(STOP_ALARM_KEY);
    }
  } catch (err) {
    console.error('Failed to save alarm settings', err);
  }
}

export function loadAlarmSettings(): StopAlarmSettings | null {
  try {
    const raw = localStorage.getItem(STOP_ALARM_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCrowdsourceReports(reports: CrowdsourceReport[]): void {
  try {
    localStorage.setItem(CROWD_REPORTS_KEY, JSON.stringify(reports));
  } catch (err) {
    console.error('Failed to save crowdsource reports', err);
  }
}

export function loadCrowdsourceReports(): CrowdsourceReport[] {
  try {
    const raw = localStorage.getItem(CROWD_REPORTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
