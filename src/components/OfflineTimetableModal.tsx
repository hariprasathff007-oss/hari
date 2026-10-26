import React, { useState } from 'react';
import { BusRoute } from '../types/bus';
import { CacheMetadata, saveTimetableToCache } from '../utils/offlineStorage';
import { WifiOff, Database, RefreshCw, CheckCircle2, Search, X, Clock, MapPin, Download } from 'lucide-react';

interface OfflineTimetableModalProps {
  isOpen: boolean;
  onClose: () => void;
  allRoutes: BusRoute[];
  cacheMeta: CacheMetadata;
  isOfflineMode: boolean;
  onToggleOfflineMode: () => void;
  onRefreshCache: () => void;
  lang: 'ta' | 'en';
  onSelectBus: (bus: BusRoute) => void;
}

export const OfflineTimetableModal: React.FC<OfflineTimetableModalProps> = ({
  isOpen,
  onClose,
  allRoutes,
  cacheMeta,
  isOfflineMode,
  onToggleOfflineMode,
  onRefreshCache,
  lang,
  onSelectBus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>(allRoutes[0]?.id || '');
  const [isSyncing, setIsSyncing] = useState(false);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIsSyncing(true);
    setTimeout(() => {
      onRefreshCache();
      setIsSyncing(false);
    }, 600);
  };

  const filteredRoutes = allRoutes.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.routeNumber.toLowerCase().includes(q) ||
      r.fromCityEn.toLowerCase().includes(q) ||
      r.fromCityTa.toLowerCase().includes(q) ||
      r.toCityEn.toLowerCase().includes(q) ||
      r.toCityTa.toLowerCase().includes(q) ||
      r.stops.some(
        (s) =>
          s.nameEn.toLowerCase().includes(q) || s.nameTa.toLowerCase().includes(q)
      )
    );
  });

  const selectedRoute = allRoutes.find((r) => r.id === selectedRouteId) || allRoutes[0];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl p-5 md:p-6 shadow-2xl relative text-slate-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white">
                  {lang === 'ta' ? 'ஆஃப்லைன் கால அட்டவணை (Offline Timetable)' : 'Offline Timetable & Cache'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {lang === 'ta' ? 'கேச் செய்யப்பட்டது' : 'Cached 100%'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'ta'
                  ? 'நெட்வொர்க் இல்லாவிட்டாலும் பேருந்து அட்டவணை முழுமையாக வேலை செய்யும் (Where is my Train போன்றது)'
                  : 'Full schedule works with zero cell coverage, stored directly in local device storage'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status & Simulation Toggle Bar */}
        <div className="mt-4 p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                <b>{cacheMeta.totalRoutes}</b> {lang === 'ta' ? 'வழித்தடங்கள் சேமிப்பில் உள்ளன' : 'Routes Cached'} ({cacheMeta.sizeKb} KB)
              </span>
            </div>
            <span>•</span>
            <span className="text-slate-400">
              {lang === 'ta' ? 'கடைசி புதுப்பிப்பு:' : 'Last Synced:'} {cacheMeta.lastUpdated}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Simulate Offline Button */}
            <button
              onClick={onToggleOfflineMode}
              className={`px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
                isOfflineMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>
                {isOfflineMode
                  ? lang === 'ta' ? 'ஆஃப்லைன் முறை: ஆன்' : 'Offline Mode: ON'
                  : lang === 'ta' ? 'ஆஃப்லைன் முறையை சோதிக்க' : 'Test Offline Mode'}
              </span>
            </button>

            {/* Sync Refresh */}
            <button
              onClick={handleRefresh}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              title="Refresh local cache"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{lang === 'ta' ? 'புதுப்பி' : 'Sync'}</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="mt-3 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'ta'
                ? 'பேருந்து எண், ஊர் அல்லது நிறுத்தம் தேடவும் (எ.கா: Thoothukudi, 111-EXP, Tirunelveli)...'
                : 'Search bus number, route or stop (e.g., Thoothukudi, Tirunelveli)...'
            }
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2.5 text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-500"
          />
        </div>

        {/* Content Columns: Route List + Stop Schedule */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 overflow-hidden min-h-[300px]">
          {/* Left: Route list */}
          <div className="overflow-y-auto pr-1 space-y-2 max-h-[360px]">
            {filteredRoutes.map((route) => {
              const isSelected = route.id === selectedRouteId;
              return (
                <div
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-sm">
                      {route.routeNumber}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {route.busType}
                    </span>
                  </div>

                  <div className="text-slate-300 font-semibold mt-1">
                    {lang === 'ta' ? route.fromCityTa : route.fromCityEn} → {lang === 'ta' ? route.toCityTa : route.toCityEn}
                  </div>

                  <div className="flex items-center justify-between text-slate-400 text-[11px] mt-1.5">
                    <span>
                      {route.departureTime} - {route.arrivalTime} ({route.durationMinutes}m)
                    </span>
                    <span className="font-semibold text-emerald-400">₹{route.fare}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Selected Route Full Stop Schedule */}
          {selectedRoute && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col overflow-hidden max-h-[360px]">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <div>
                  <div className="font-bold text-white text-sm">
                    {selectedRoute.routeNumber} • {lang === 'ta' ? selectedRoute.fromCityTa : selectedRoute.fromCityEn} → {lang === 'ta' ? selectedRoute.toCityTa : selectedRoute.toCityEn}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedRoute.stops.length} {lang === 'ta' ? 'நிறுத்தங்கள்' : 'stops'} • {selectedRoute.depot}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectBus(selectedRoute);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition-transform active:scale-95"
                >
                  {lang === 'ta' ? 'வரைபடத்தில் பார்' : 'View on Map'}
                </button>
              </div>

              {/* Stop timetable list */}
              <div className="overflow-y-auto space-y-2 pr-1 flex-1">
                {selectedRoute.stops.map((stop, sIdx) => (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-mono shrink-0">
                        {sIdx + 1}
                      </span>
                      <div className="truncate">
                        <div className="font-medium text-slate-200 truncate">
                          {lang === 'ta' ? stop.nameTa : stop.nameEn}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {stop.distanceFromStartKm} km from start
                        </div>
                      </div>
                    </div>

                    <div className="font-mono text-emerald-400 font-bold shrink-0 ml-2">
                      {stop.scheduledTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
