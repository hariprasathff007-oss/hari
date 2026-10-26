import React from 'react';
import { BusRoute } from '../types/bus';
import { Clock, MapPin, Navigation, Bell, AlertTriangle, ShieldCheck, ArrowRight, Users } from 'lucide-react';
import { calculateDistanceKm, calculateETA } from '../utils/busLogic';

interface BusListProps {
  buses: BusRoute[];
  selectedBusId: string;
  onSelectBus: (bus: BusRoute) => void;
  onOpenAlarm: (bus: BusRoute, stopId?: string) => void;
  onOpenCrowdsource: (bus: BusRoute) => void;
  lang: 'ta' | 'en';
}

export const BusList: React.FC<BusListProps> = ({
  buses,
  selectedBusId,
  onSelectBus,
  onOpenAlarm,
  onOpenCrowdsource,
  lang,
}) => {
  if (buses.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
          <Navigation className="w-6 h-6" />
        </div>
        <h4 className="text-base font-bold text-white">
          {lang === 'ta' ? 'பேருந்துகள் எதுவும் கிடைக்கவில்லை' : 'No buses found for this search'}
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          {lang === 'ta'
            ? 'தேர்ந்தெடுத்த ஊர்களை மாற்றி பார்க்கவும் (எ.கா: Thoothukudi → Tirunelveli அல்லது All Types).'
            : 'Try selecting a different origin or destination corridor like Thoothukudi → Tirunelveli.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          {lang === 'ta'
            ? `${buses.length} பேருந்துகள் இயக்கத்தில் உள்ளன`
            : `Showing ${buses.length} active buses`}
        </span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          {lang === 'ta' ? 'ஜிபிஎஸ் நேரலை கண்காணிப்பு' : 'Live GPS Connected'}
        </span>
      </div>

      {buses.map((bus) => {
        const isSelected = bus.id === selectedBusId;
        const currentStop = bus.stops[bus.currentStopIndex] || bus.stops[0];
        const nextStop = bus.stops[bus.currentStopIndex + 1] || currentStop;

        const distanceKm = calculateDistanceKm(
          bus.currentLocation.lat,
          bus.currentLocation.lng,
          nextStop.lat,
          nextStop.lng
        );
        const etaMin = calculateETA(distanceKm, bus.currentLocation.speedKmH, bus.delayMinutes);

        return (
          <div
            key={bus.id}
            onClick={() => onSelectBus(bus)}
            className={`rounded-2xl border transition-all p-4 md:p-5 relative overflow-hidden cursor-pointer ${
              isSelected
                ? 'bg-slate-800/95 border-emerald-500 shadow-xl ring-1 ring-emerald-500/50'
                : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md hover:bg-slate-850'
            }`}
          >
            {/* Top row: Route Number, Bus Type, Plate, Fare */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-mono font-extrabold text-sm rounded-lg shadow-sm">
                  {bus.routeNumber}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {bus.busType}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {bus.busNumberPlate}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-base font-extrabold text-emerald-400">₹{bus.fare}</div>
                  <div className="text-[10px] text-slate-400">{bus.frequency}</div>
                </div>
              </div>
            </div>

            {/* Middle row: Origin -> Destination, Departure & Arrival Timings */}
            <div className="py-3 grid grid-cols-1 sm:grid-cols-3 items-center gap-3">
              {/* Origin */}
              <div>
                <div className="text-[11px] text-slate-400 font-medium">
                  {lang === 'ta' ? 'புறப்படும் இடம்' : 'Departure'}
                </div>
                <div className="font-bold text-white text-sm sm:text-base">
                  {lang === 'ta' ? bus.fromCityTa : bus.fromCityEn}
                </div>
                <div className="font-mono text-xs text-emerald-400 font-semibold mt-0.5">
                  {bus.departureTime}
                </div>
              </div>

              {/* Journey Duration Center */}
              <div className="flex flex-col items-center justify-center text-center py-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3" />
                  {Math.floor(bus.durationMinutes / 60)}h {bus.durationMinutes % 60}m
                </span>
                <div className="w-full flex items-center gap-1 my-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-500"></div>
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-[10px] text-slate-500">
                  {bus.stops.length} {lang === 'ta' ? 'நிறுத்தங்கள்' : 'stops'}
                </span>
              </div>

              {/* Destination */}
              <div className="sm:text-right">
                <div className="text-[11px] text-slate-400 font-medium">
                  {lang === 'ta' ? 'சென்றடையும் இடம்' : 'Arrival'}
                </div>
                <div className="font-bold text-white text-sm sm:text-base">
                  {lang === 'ta' ? bus.toCityTa : bus.toCityEn}
                </div>
                <div className="font-mono text-xs text-indigo-400 font-semibold mt-0.5">
                  {bus.arrivalTime}
                </div>
              </div>
            </div>

            {/* Next Stop + Delay Highlight Banner */}
            <div className="mt-1 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                <div className="truncate">
                  <span className="text-slate-400">
                    {lang === 'ta' ? 'அடுத்த ஸ்டாப்:' : 'Next stop:'}{' '}
                  </span>
                  <span className="font-bold text-white">
                    {lang === 'ta' ? nextStop.nameTa : nextStop.nameEn}
                  </span>
                  <span className="text-emerald-300 font-mono font-semibold ml-1.5">
                    ({etaMin} {lang === 'ta' ? 'நிமிடம்' : 'mins'} • {distanceKm} km)
                  </span>
                </div>
              </div>

              {/* Delay badge */}
              {bus.delayMinutes > 0 ? (
                <span className="px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-800 font-bold flex items-center gap-1 text-[11px]">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{lang === 'ta' ? `Delayed by ${bus.delayMinutes} mins` : `+${bus.delayMinutes}m delay`}</span>
                </span>
              ) : (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'சரியான நேரத்தில்' : 'On Time'}</span>
                </span>
              )}
            </div>

            {/* Bottom Action Buttons */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAlarm(bus, nextStop.id)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'ஸ்டாப் அலாரம்' : 'Set Alarm'}</span>
                </button>

                <button
                  onClick={() => onOpenCrowdsource(bus)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-blue-200 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'ta' ? 'பயணிகள் தகவல்' : 'Reports'} ({bus.crowdsourceReports.length})
                  </span>
                </button>
              </div>

              <button
                onClick={() => onSelectBus(bus)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                    : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>
                  {isSelected
                    ? lang === 'ta' ? 'வரைபடத்தில் பார்க்கப்படுகிறது' : 'Tracking on Map'
                    : lang === 'ta' ? 'வரைபடத்தில் பார் (Live Map)' : 'Track Live on Map'}
                </span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
