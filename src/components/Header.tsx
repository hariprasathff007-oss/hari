import React from 'react';
import { Bus, Languages, Database, Bell, Volume2, ShieldAlert } from 'lucide-react';
import { StopAlarmSettings } from '../types/bus';
import { playBusHorn } from '../utils/soundEffects';

interface HeaderProps {
  lang: 'ta' | 'en';
  onToggleLang: () => void;
  onOpenOfflineTimetable: () => void;
  activeAlarm: StopAlarmSettings | null;
  onOpenAlarmModal: () => void;
  isOfflineMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  onToggleLang,
  onOpenOfflineTimetable,
  activeAlarm,
  onOpenAlarmModal,
  isOfflineMode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold">
            <Bus className="w-6 h-6 text-slate-950" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>TN Bus Live</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 hidden sm:inline-block">
                  {lang === 'ta' ? 'நம்ம ஊரு பஸ்' : 'Where is my Bus'}
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden xs:block">
              {lang === 'ta'
                ? 'நேரலை ஜிபிஎஸ் • அடுத்த ஸ்டாப் ETA • ஸ்டாப் அலாரம் • ஆஃப்லைன் அட்டவணை'
                : 'Live GPS • Next Stop ETA • Destination Alarm • Offline Timetable'}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Active Alarm Badge if armed */}
          {activeAlarm && activeAlarm.enabled && (
            <button
              onClick={onOpenAlarmModal}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse"
              title="Destination alarm is active"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">
                {lang === 'ta' ? 'அலாரம்:' : 'Alarm:'} {activeAlarm.targetStopNameEn}
              </span>
            </button>
          )}

          {/* Quick Offline Timetable Button */}
          <button
            onClick={onOpenOfflineTimetable}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isOfflineMode
                ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
            title="Open Offline Timetable & Cache"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {lang === 'ta' ? 'ஆஃப்லைன் அட்டவணை' : 'Offline Timetable'}
            </span>
            {isOfflineMode && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>

          {/* Bus Horn quick sound trigger */}
          <button
            onClick={() => playBusHorn(0.6)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-transform active:scale-90"
            title={lang === 'ta' ? 'பஸ் ஹார்ன் ஒலி' : 'Sound Bus Horn'}
            aria-label="Sound Bus Horn"
          >
            <Volume2 className="w-4 h-4 text-amber-400" />
          </button>

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
