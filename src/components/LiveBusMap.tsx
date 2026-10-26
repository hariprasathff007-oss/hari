import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { BusRoute } from '../types/bus';
import { Locate, Navigation, Play, Pause, AlertTriangle } from 'lucide-react';

interface LiveBusMapProps {
  bus: BusRoute;
  lang: 'ta' | 'en';
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onSelectStop?: (stopId: string) => void;
  targetAlarmStopId?: string;
}

export const LiveBusMap: React.FC<LiveBusMapProps> = ({
  bus,
  lang,
  isSimulating,
  onToggleSimulation,
  onSelectStop,
  targetAlarmStopId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const stopMarkersRef = useRef<L.CircleMarker[]>([]);
  const shouldFollowBusRef = useRef<boolean>(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center at bus current location
    const map = L.map(mapContainerRef.current, {
      center: [bus.currentLocation.lat, bus.currentLocation.lng],
      zoom: 12,
      zoomControl: false,
    });

    // OpenStreetMap standard tiles (Zero API key required, reliable worldwide)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Ensure map tiles render properly after container layout
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    // Disable auto-follow when user manually drags map
    map.on('dragstart', () => {
      shouldFollowBusRef.current = false;
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Route Polyline & Stop Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old stop markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    // Route coordinates
    const routeCoords = bus.stops.map((s) => [s.lat, s.lng] as [number, number]);

    // Draw route line
    if (polylineRef.current) {
      polylineRef.current.setLatLngs(routeCoords);
    } else {
      polylineRef.current = L.polyline(routeCoords, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.8,
        dashArray: undefined,
      }).addTo(map);
    }

    // Add Stop Markers
    bus.stops.forEach((stop, index) => {
      const isPassed = index < bus.currentStopIndex;
      const isNext = index === bus.currentStopIndex;
      const isAlarmTarget = stop.id === targetAlarmStopId;

      let color = '#3b82f6';
      let radius = 6;
      let fillOpacity = 0.9;

      if (isPassed) {
        color = '#94a3b8';
        radius = 5;
        fillOpacity = 0.6;
      } else if (isNext) {
        color = '#10b981';
        radius = 9;
        fillOpacity = 1;
      }

      if (isAlarmTarget) {
        color = '#f59e0b';
        radius = 10;
      }

      const circleMarker = L.circleMarker([stop.lat, stop.lng], {
        radius,
        color: isNext ? '#059669' : isAlarmTarget ? '#d97706' : '#1e3a8a',
        weight: 2,
        fillColor: color,
        fillOpacity,
      }).addTo(map);

      // Tooltip / Popup
      const stopTitle = lang === 'ta' ? stop.nameTa : stop.nameEn;
      const statusBadge = isPassed
        ? lang === 'ta' ? 'கடந்த நிறுத்தம்' : 'Passed'
        : isNext
        ? lang === 'ta' ? 'அடுத்த நிறுத்தம் (Next Stop)' : 'Next Stop'
        : isAlarmTarget
        ? lang === 'ta' ? '🔔 இலக்கு அலாரம்' : '🔔 Alarm Stop'
        : lang === 'ta' ? 'வரவிருக்கும் நிறுத்தம்' : 'Upcoming';

      circleMarker.bindPopup(`
        <div class="text-slate-100 font-sans p-1 text-sm">
          <div class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">${statusBadge}</div>
          <div class="font-bold text-base mt-0.5 text-white">${stopTitle}</div>
          <div class="text-xs text-slate-300 mt-1">
            <b>${lang === 'ta' ? 'நேரம்:' : 'Time:'}</b> ${stop.estimatedTime || stop.scheduledTime} | <b>${stop.distanceFromStartKm} km</b>
          </div>
        </div>
      `);

      circleMarker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.id);
      });

      stopMarkersRef.current.push(circleMarker);
    });
  }, [bus.id, bus.stops, bus.currentStopIndex, targetAlarmStopId, lang]);

  // Update Moving Bus Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const busLatLng = [bus.currentLocation.lat, bus.currentLocation.lng] as [number, number];

    // Custom Bus Icon HTML
    const busIconHtml = `
      <div class="relative flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
        <!-- Pulse halo for live moving bus -->
        <span class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></span>
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-emerald-500/50">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h8m-8 4h8m-4 8v-2m-6 2h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <!-- Route / Plate Tag -->
        <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow border border-slate-700">
          ${bus.routeNumber} • ${bus.currentLocation.speedKmH} km/h
        </div>
      </div>
    `;

    const customBusIcon = L.divIcon({
      html: busIconHtml,
      className: 'live-bus-leaflet-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng(busLatLng);
      busMarkerRef.current.setIcon(customBusIcon);
    } else {
      busMarkerRef.current = L.marker(busLatLng, { icon: customBusIcon, zIndexOffset: 1000 }).addTo(map);
      busMarkerRef.current.bindPopup(`
        <div class="font-sans text-slate-100 p-1">
          <div class="font-bold text-sm text-emerald-400">${bus.routeNumber} (${bus.busType})</div>
          <div class="text-xs font-mono text-slate-300">${bus.busNumberPlate}</div>
          <div class="mt-1 text-xs text-slate-200"><b>Speed:</b> ${bus.currentLocation.speedKmH} km/h</div>
          <div class="text-xs text-slate-400">Updated: ${bus.currentLocation.lastUpdated}</div>
        </div>
      `);
    }

    if (shouldFollowBusRef.current) {
      map.panTo(busLatLng, { animate: true, duration: 0.8 });
    }
  }, [bus.currentLocation, bus.routeNumber, bus.busType, bus.busNumberPlate]);

  const recenterOnBus = () => {
    shouldFollowBusRef.current = true;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([bus.currentLocation.lat, bus.currentLocation.lng], 13, {
        animate: true,
      });
    }
  };

  const fitFullRoute = () => {
    shouldFollowBusRef.current = false;
    if (mapInstanceRef.current && polylineRef.current) {
      mapInstanceRef.current.fitBounds(polylineRef.current.getBounds(), {
        padding: [30, 30],
      });
    }
  };

  return (
    <div className="relative w-full h-[380px] md:h-[460px] rounded-2xl overflow-hidden shadow-xl border border-slate-700/60 bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Speed & Status Badge */}
      <div className="absolute top-3 left-3 z-[400] flex flex-wrap gap-2 items-center">
        <div className="bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-xs shadow-lg flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">
            {lang === 'ta' ? 'நேரலை இயக்கம்' : 'LIVE GPS'}
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-white font-bold">{bus.currentLocation.speedKmH} km/h</span>
        </div>

        {bus.delayMinutes > 0 && (
          <div className="bg-amber-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-amber-600/50 text-xs shadow-lg flex items-center gap-1.5 text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {lang === 'ta' ? `${bus.delayMinutes} நிமிடம் தாமதம்` : `Delayed +${bus.delayMinutes}m`}
            </span>
          </div>
        )}
      </div>

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          onClick={recenterOnBus}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-lg transition-transform active:scale-95 flex items-center justify-center title"
          title={lang === 'ta' ? 'பஸ் இருக்கும் இடத்திற்கு செல்' : 'Recenter on Bus'}
          aria-label="Recenter on bus"
        >
          <Locate className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={fitFullRoute}
          className="bg-slate-900/90 hover:bg-slate-800 text-slate-100 p-2.5 rounded-xl border border-slate-700 shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          title={lang === 'ta' ? 'முழு வழியையும் பார்க்க' : 'Fit full route'}
          aria-label="View entire route"
        >
          <Navigation className="w-4 h-4 text-blue-400" />
        </button>

        <button
          onClick={onToggleSimulation}
          className={`p-2.5 rounded-xl border shadow-lg transition-all active:scale-95 flex items-center justify-center ${
            isSimulating
              ? 'bg-emerald-600 text-white border-emerald-500 animate-pulse'
              : 'bg-slate-900/90 text-slate-300 hover:text-white border-slate-700'
          }`}
          title={isSimulating ? (lang === 'ta' ? 'இயக்கத்தை நிறுத்து' : 'Pause Simulation') : (lang === 'ta' ? 'இயக்கத்தை தொடங்கு' : 'Start Simulation')}
          aria-label="Toggle bus simulation"
        >
          {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>{lang === 'ta' ? 'அடுத்த ஸ்டாப்' : 'Next Stop'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <span>{lang === 'ta' ? 'நிறுத்தங்கள்' : 'Stops'}</span>
        </div>
        {targetAlarmStopId && (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>{lang === 'ta' ? 'அலாரம் நிறுத்தம்' : 'Alarm'}</span>
          </div>
        )}
      </div>
    </div>
  );
};
