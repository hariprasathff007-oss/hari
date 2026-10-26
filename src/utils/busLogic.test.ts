import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  calculateETA,
  formatNextStopMessage,
  shouldAlarmTrigger,
  searchBuses,
  calculateRouteProgress,
  interpolatePosition,
} from './busLogic';
import { BusRoute } from '../types/bus';

test('calculateDistanceKm calculates approximate distance between Thoothukudi and Tirunelveli', () => {
  // Thoothukudi (8.7642, 78.1348) to Tirunelveli (8.7139, 77.7567) is roughly 42-48 km
  const distance = calculateDistanceKm(8.7642, 78.1348, 8.7139, 77.7567);
  assert.ok(distance > 40 && distance < 50, `Distance should be ~42km, got ${distance}`);
});

test('calculateETA handles normal speed and adds delay minutes', () => {
  // 30 km at 60 km/h is 30 mins, with 10 mins delay = 40 mins
  const eta = calculateETA(30, 60, 10);
  assert.equal(eta, 40);

  // Very small distance should return at least 1 min
  const nearEta = calculateETA(0.05, 50, 0);
  assert.equal(nearEta, 1);
});

test('formatNextStopMessage generates exact Tamil and English prompt string', () => {
  const msgTa = formatNextStopMessage('Thoothukudi New Bus Stand', 'தூத்துக்குடி புதிய பேருந்து நிலையம்', 8, 'ta');
  assert.equal(msgTa, 'உங்க bus 8 நிமிடத்தில் தூத்துக்குடி புதிய பேருந்து நிலையம் வரும்');

  const msgEn = formatNextStopMessage('Thoothukudi New Bus Stand', 'தூத்துக்குடி புதிய பேருந்து நிலையம்', 8, 'en');
  assert.equal(msgEn, 'Your bus will arrive at Thoothukudi New Bus Stand in 8 mins');
});

test('shouldAlarmTrigger properly fires based on settings', () => {
  // 1 stop before trigger
  // target is index 5, current is index 4 -> 1 stop away -> should trigger
  assert.equal(shouldAlarmTrigger(4, 5, 6, 8, '1_stop'), true);
  // target is index 5, current is index 2 -> 3 stops away -> should NOT trigger
  assert.equal(shouldAlarmTrigger(2, 5, 15, 20, '1_stop'), false);

  // 5 mins before trigger
  assert.equal(shouldAlarmTrigger(2, 5, 3.5, 4, '5_mins'), true);
  assert.equal(shouldAlarmTrigger(2, 5, 8.0, 9, '5_mins'), false);

  // 2 km before trigger
  assert.equal(shouldAlarmTrigger(2, 5, 1.8, 5, '2_km'), true);
  assert.equal(shouldAlarmTrigger(2, 5, 4.0, 8, '2_km'), false);
});

test('searchBuses matches origin and destination in Tamil and English', () => {
  const dummyBuses: BusRoute[] = [
    {
      id: 'b1',
      routeNumber: '111-EXP',
      busNumberPlate: 'TN 72 N 2489',
      depot: 'Thoothukudi',
      fromCityEn: 'Thoothukudi',
      fromCityTa: 'தூத்துக்குடி',
      toCityEn: 'Tirunelveli',
      toCityTa: 'திருநெல்வேலி',
      departureTime: '08:00 AM',
      arrivalTime: '09:15 AM',
      durationMinutes: 75,
      busType: '1 to 1 Non Stop',
      fare: 55,
      frequency: 'Every 10 mins',
      stops: [
        { id: 's1', nameEn: 'Thoothukudi', nameTa: 'தூத்துக்குடி', lat: 8.76, lng: 78.13, scheduledTime: '08:00 AM', distanceFromStartKm: 0 },
        { id: 's2', nameEn: 'Tirunelveli', nameTa: 'திருநெல்வேலி', lat: 8.71, lng: 77.75, scheduledTime: '09:15 AM', distanceFromStartKm: 46 }
      ],
      currentLocation: { lat: 8.76, lng: 78.13, speedKmH: 45, heading: 260, lastUpdated: 'Just now' },
      currentStopIndex: 0,
      progressPercent: 10,
      delayMinutes: 0,
      crowdsourceReports: [],
      delayAlerts: [],
      isTrackingLive: true,
    },
    {
      id: 'b2',
      routeNumber: 'SETC 214',
      busNumberPlate: 'TN 01 AN 0891',
      depot: 'Madurai',
      fromCityEn: 'Madurai',
      fromCityTa: 'மதுரை',
      toCityEn: 'Chennai',
      toCityTa: 'சென்னை',
      departureTime: '10:00 PM',
      arrivalTime: '06:00 AM',
      durationMinutes: 480,
      busType: 'SETC AC Sleeper',
      fare: 750,
      frequency: 'Every 30 mins',
      stops: [],
      currentLocation: { lat: 9.92, lng: 78.11, speedKmH: 60, heading: 45, lastUpdated: 'Just now' },
      currentStopIndex: 0,
      progressPercent: 20,
      delayMinutes: 15,
      crowdsourceReports: [],
      delayAlerts: [],
      isTrackingLive: true,
    }
  ];

  // Search Thoothukudi -> Tirunelveli
  const results = searchBuses(dummyBuses, 'Thoothukudi', 'Tirunelveli');
  assert.equal(results.length, 1);
  assert.equal(results[0].routeNumber, '111-EXP');

  // Search using Tamil query
  const resultsTa = searchBuses(dummyBuses, 'தூத்துக்குடி', 'திருநெல்வேலி');
  assert.equal(resultsTa.length, 1);

  // Search by bus type
  const filterType = searchBuses(dummyBuses, '', '', 'SETC AC Sleeper');
  assert.equal(filterType.length, 1);
  assert.equal(filterType[0].routeNumber, 'SETC 214');
});

test('calculateRouteProgress and interpolatePosition compute smooth progress', () => {
  const stops = [
    { id: '1', nameEn: 'A', nameTa: 'A', lat: 8.0, lng: 78.0, scheduledTime: '08:00', distanceFromStartKm: 0 },
    { id: '2', nameEn: 'B', nameTa: 'B', lat: 8.5, lng: 78.5, scheduledTime: '08:30', distanceFromStartKm: 20 },
    { id: '3', nameEn: 'C', nameTa: 'C', lat: 9.0, lng: 79.0, scheduledTime: '09:00', distanceFromStartKm: 40 },
  ];

  const progress = calculateRouteProgress(stops, 1, 0.5);
  // Total segments = 2. Index 1 with 0.5 is 1.5/2 = 75%
  assert.equal(progress, 75);

  const interpolated = interpolatePosition({ lat: 10, lng: 20 }, { lat: 20, lng: 40 }, 0.5);
  assert.equal(interpolated.lat, 15);
  assert.equal(interpolated.lng, 30);
});
