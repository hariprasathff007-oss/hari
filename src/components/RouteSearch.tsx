import React from 'react';
import { ALL_CITIES, POPULAR_ROUTES } from '../data/mockBusData';
import { ArrowLeftRight, Search, Filter, Bus, Sparkles } from 'lucide-react';
import { BusType } from '../types/bus';

interface RouteSearchProps {
  fromCity: string;
  toCity: string;
  onChangeFrom: (city: string) => void;
  onChangeTo: (city: string) => void;
  onSwapCities: () => void;
  selectedBusType: string;
  onSelectBusType: (type: string) => void;
  lang: 'ta' | 'en';
  searchFilterText: string;
  onChangeSearchFilterText: (text: string) => void;
}

export const RouteSearch: React.FC<RouteSearchProps> = ({
  fromCity,
  toCity,
  onChangeFrom,
  onChangeTo,
  onSwapCities,
  selectedBusType,
  onSelectBusType,
  lang,
  searchFilterText,
  onChangeSearchFilterText,
}) => {
  const busTypes: (string | BusType)[] = [
    'All',
    '1 to 1 Non Stop',
    'Point-to-Point Express',
    'SETC Ultra Deluxe',
    'SETC AC Sleeper',
    'TNSTC Deluxe',
    'TNSTC Ordinary',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
      {/* Route Inputs (From -> To) */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* From City */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {lang === 'ta' ? 'புறப்படும் ஊர் (From)' : 'From (Origin)'}
          </label>
          <div className="relative">
            <select
              value={fromCity}
              onChange={(e) => onChangeFrom(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-3.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">{lang === 'ta' ? '-- அனைத்து ஊர்களும் --' : '-- All Origins --'}</option>
              {ALL_CITIES.map((c) => (
                <option key={c.nameEn} value={c.nameEn}>
                  {lang === 'ta' ? c.nameTa : c.nameEn} ({c.nameEn})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <Bus className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Swap button */}
        <div className="flex justify-center md:pt-5">
          <button
            onClick={onSwapCities}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-transform active:scale-90 shadow"
            title={lang === 'ta' ? 'இடங்களை மாற்று' : 'Swap Origin & Destination'}
            aria-label="Swap cities"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
          </button>
        </div>

        {/* To City */}
        <div className="relative">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {lang === 'ta' ? 'சென்றடையும் ஊர் (To)' : 'To (Destination)'}
          </label>
          <div className="relative">
            <select
              value={toCity}
              onChange={(e) => onChangeTo(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl py-3 px-3.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="">{lang === 'ta' ? '-- அனைத்து ஊர்களும் --' : '-- All Destinations --'}</option>
              {ALL_CITIES.map((c) => (
                <option key={c.nameEn} value={c.nameEn}>
                  {lang === 'ta' ? c.nameTa : c.nameEn} ({c.nameEn})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <Bus className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Popular Route Shortcuts (Specifically highlighting Thoothukudi -> Tirunelveli from prompt) */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{lang === 'ta' ? 'முக்கிய வழித்தடங்கள்:' : 'Popular:'}</span>
        </span>

        {POPULAR_ROUTES.map((item, idx) => {
          const isActive = fromCity === item.fromEn && toCity === item.toEn;
          return (
            <button
              key={idx}
              onClick={() => {
                onChangeFrom(item.fromEn);
                onChangeTo(item.toEn);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {lang === 'ta' ? `${item.fromTa} → ${item.toTa}` : `${item.fromEn} → ${item.toEn}`}
            </button>
          );
        })}
      </div>

      {/* Bus Type Filters & Quick Code Search */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Bus Type Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
          {busTypes.map((type) => (
            <button
              key={type}
              onClick={() => onSelectBusType(type)}
              className={`shrink-0 px-2.5 py-1 rounded-lg border transition-colors ${
                selectedBusType === type
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-semibold'
                  : 'bg-slate-800/50 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {type === 'All' ? (lang === 'ta' ? 'அனைத்து பஸ்களும்' : 'All Types') : type}
            </button>
          ))}
        </div>

        {/* Free text search for bus number plate or route name */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilterText}
            onChange={(e) => onChangeSearchFilterText(e.target.value)}
            placeholder={
              lang === 'ta'
                ? 'பஸ் எண் (எ.கா: 111, TN-72)...'
                : 'Bus plate / route (e.g. 111, 214)...'
            }
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder:text-slate-500"
          />
        </div>
      </div>
    </div>
  );
};
