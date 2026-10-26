import React from 'react';
import { BusRoute } from '../types/bus';
import { formatNextStopMessage, calculateDistanceKm, calculateETA } from '../utils/busLogic';
import { Clock, Navigation2, Volume2, Bell, CheckCircle2, CircleDot } from 'lucide-react';
import { playBusHorn } from '../utils/soundEffects';

interface NextStopETAProps {
  bus: BusRoute;
  lang: 'ta' | 'en';
  onOpenAlarm: (stopId?: string) => void;
  targetAlarmStopId?: string;
}

export const NextStopETA: React.FC<NextStopETAProps> = ({
  bus,
  lang,
  onOpenAlarm,
  targetAlarmStopId,
}) => {
  const currentStop = bus.stops[bus.currentStopIndex] || bus.stops[0];
  const nextStop = bus.stops[bus.currentStopIndex + 1] || currentStop;

  // Calculate distance to next stop
  const distanceKm = calculateDistanceKm(
    bus.currentLocation.lat,
    bus.currentLocation.lng,
    nextStop.lat,
    nextStop.lng
  );

  // Dynamic ETA
  const etaMinutes = calculateETA(distanceKm, bus.currentLocation.speedKmH, bus.delayMinutes);

  // Formatted prominent message exactly as requested
  const bannerMessage = formatNextStopMessage(
    nextStop.nameEn,
    nextStop.nameTa,
    etaMinutes,
    lang
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Prominent Next Stop Highlight Box */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-2xl p-4 md:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
              <CircleDot className="w-6 h-6 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-800">
                  {lang === 'ta' ? 'அடுத்த நிறுத்தம்' : 'Next Stop'}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {nextStop.estimatedTime || nextStop.scheduledTime}
                </span>
              </div>

              {/* Exact user prompt requirement */}
              <h2 className="text-lg md:text-xl font-extrabold text-white mt-1 leading-snug">
                {bannerMessage}
              </h2>

              <p className="text-xs md:text-sm text-slate-300 mt-0.5 flex items-center gap-2">
                <span>{lang === 'ta' ? 'தொலைவு:' : 'Distance:'} <b className="text-emerald-300">{distanceKm} km</b></span>
                <span>•</span>
                <span>{lang === 'ta' ? 'வேகம்:' : 'Speed:'} <b className="text-slate-200">{bus.currentLocation.speedKmH} km/h</b></span>
              </p>
            </div>
          </div>

          {/* Quick Actions: Stop Alarm & Horn */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => playBusHorn(0.7)}
              className="flex-1 sm:flex-none px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow"
              title={lang === 'ta' ? 'பஸ் ஹார்ன் ஒலியை எழுப்பு' : 'Sound Bus Horn'}
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ta' ? 'ஹார்ன்' : 'Horn'}</span>
            </button>

            <button
              onClick={() => onOpenAlarm(nextStop.id)}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
              title={lang === 'ta' ? 'இந்த நிறுத்தத்திற்கு அலாரம் வை' : 'Set Destination Alarm'}
            >
              <Bell className="w-4 h-4 text-slate-950" />
              <span>{lang === 'ta' ? 'ஸ்டாப் அலாரம்' : 'Stop Alarm'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stop Progression Timeline */}
      <div className="mt-5">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{lang === 'ta' ? 'பயண வழியின் நிறுத்தங்கள்' : 'Route Timeline & Stops'}</span>
          <span>
            {bus.currentStopIndex + 1} / {bus.stops.length} {lang === 'ta' ? 'நிறுத்தங்கள் கடந்தது' : 'stops'}
          </span>
        </div>

        {/* Horizontal scrollable stops */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {bus.stops.map((stop, idx) => {
            const isPassed = idx < bus.currentStopIndex;
            const isCurrentNext = idx === bus.currentStopIndex;
            const isAlarmStop = stop.id === targetAlarmStopId;

            return (
              <div
                key={stop.id}
                className={`shrink-0 min-w-[130px] p-2.5 rounded-xl border text-xs transition-all relative ${
                  isCurrentNext
                    ? 'bg-emerald-950/60 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : isPassed
                    ? 'bg-slate-950/50 border-slate-800 text-slate-500'
                    : isAlarmStop
                    ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] text-slate-400">
                    {stop.distanceFromStartKm} km
                  </span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                  ) : isCurrentNext ? (
                    <CircleDot className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : isAlarmStop ? (
                    <Bell className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-600"></span>
                  )}
                </div>

                <div className="font-semibold text-white truncate" title={lang === 'ta' ? stop.nameTa : stop.nameEn}>
                  {lang === 'ta' ? stop.nameTa : stop.nameEn}
                </div>

                <div className="text-[11px] text-slate-400 mt-0.5">
                  {stop.estimatedTime || stop.scheduledTime}
                </div>

                {!isPassed && (
                  <button
                    onClick={() => onOpenAlarm(stop.id)}
                    className="mt-2 w-full text-[10px] py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium border border-slate-700"
                  >
                    {isAlarmStop ? (lang === 'ta' ? 'அலாரம் ஆன்' : 'Alarm Set') : (lang === 'ta' ? '+ அலாரம்' : '+ Alarm')}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
