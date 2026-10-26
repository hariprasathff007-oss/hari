import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BusRoute, CrowdsourceReport, StopAlarmSettings } from './types/bus';
import { INITIAL_BUS_ROUTES } from './data/mockBusData';
import {
  searchBuses,
  calculateDistanceKm,
  calculateETA,
  shouldAlarmTrigger,
  interpolatePosition,
  formatNextStopMessage,
} from './utils/busLogic';
import {
  loadTimetableFromCache,
  saveTimetableToCache,
  getCacheMetadata,
  loadAlarmSettings,
  saveAlarmSettings,
  loadCrowdsourceReports,
  saveCrowdsourceReports,
  CacheMetadata,
} from './utils/offlineStorage';
import { playAlarmSound } from './utils/soundEffects';

import { Header } from './components/Header';
import { RouteSearch } from './components/RouteSearch';
import { BusList } from './components/BusList';
import { LiveBusMap } from './components/LiveBusMap';
import { NextStopETA } from './components/NextStopETA';
import { DelayAlertsBanner } from './components/DelayAlertsBanner';
import { CrowdsourceModal, CrowdsourceFeed } from './components/CrowdsourceModal';
import { StopAlarmModal, AlarmTriggeredModal } from './components/StopAlarmModal';
import { OfflineTimetableModal } from './components/OfflineTimetableModal';

import { Map, List, Bell, Database, AlertTriangle, ShieldCheck, Sparkles, Navigation } from 'lucide-react';

export default function App() {
  // Language State: 'ta' (Tamil) by default as requested in prompt, or 'en'
  const [lang, setLang] = useState<'ta' | 'en'>('ta');

  // Search Criteria - pre-fill Thoothukudi -> Tirunelveli as in prompt
  const [fromCity, setFromCity] = useState<string>('Thoothukudi');
  const [toCity, setToCity] = useState<string>('Tirunelveli');
  const [selectedBusType, setSelectedBusType] = useState<string>('All');
  const [searchFilterText, setSearchFilterText] = useState<string>('');

  // Active Buses State
  const [allBuses, setAllBuses] = useState<BusRoute[]>(() => {
    const cached = loadTimetableFromCache();
    return cached && cached.length > 0 ? cached : INITIAL_BUS_ROUTES;
  });

  // Selected Bus (default to 111-01 or 111-incoming)
  const [selectedBusId, setSelectedBusId] = useState<string>(() => {
    return allBuses[0]?.id || INITIAL_BUS_ROUTES[0].id;
  });

  // Offline Simulation Mode
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [cacheMeta, setCacheMeta] = useState<CacheMetadata>(() =>
    getCacheMetadata(INITIAL_BUS_ROUTES)
  );

  // Stop Alarm State
  const [activeAlarm, setActiveAlarm] = useState<StopAlarmSettings | null>(() =>
    loadAlarmSettings()
  );
  const [alarmModalOpen, setAlarmModalOpen] = useState<boolean>(false);
  const [alarmTargetStopPreset, setAlarmTargetStopPreset] = useState<string | undefined>(undefined);
  const [triggeredAlarm, setTriggeredAlarm] = useState<StopAlarmSettings | null>(null);

  // Crowdsource Modal State
  const [crowdsourceModalOpen, setCrowdsourceModalOpen] = useState<boolean>(false);

  // Offline Timetable Modal State
  const [offlineModalOpen, setOfflineModalOpen] = useState<boolean>(false);

  // Simulation play/pause state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Mobile View Tab: 'map' or 'buses'
  const [mobileTab, setMobileTab] = useState<'map' | 'buses'>('map');

  // Active selected bus object
  const currentBus = useMemo(() => {
    return allBuses.find((b) => b.id === selectedBusId) || allBuses[0];
  }, [allBuses, selectedBusId]);

  // Filtered bus list based on search criteria
  const filteredBuses = useMemo(() => {
    const searched = searchBuses(allBuses, fromCity, toCity, selectedBusType);
    if (!searchFilterText.trim()) return searched;
    const term = searchFilterText.toLowerCase().trim();
    return searched.filter(
      (b) =>
        b.routeNumber.toLowerCase().includes(term) ||
        b.busNumberPlate.toLowerCase().includes(term) ||
        b.busType.toLowerCase().includes(term)
    );
  }, [allBuses, fromCity, toCity, selectedBusType, searchFilterText]);

  // Live GPS simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setAllBuses((prevBuses) => {
        return prevBuses.map((bus) => {
          if (!bus.isTrackingLive || bus.stops.length < 2) return bus;

          const currentIdx = bus.currentStopIndex;
          const nextIdx = currentIdx + 1;

          // If reached the end of route, loop back to start for continuous demo
          if (nextIdx >= bus.stops.length) {
            return {
              ...bus,
              currentStopIndex: 0,
              currentLocation: {
                ...bus.currentLocation,
                lat: bus.stops[0].lat,
                lng: bus.stops[0].lng,
                lastUpdated: 'Just now',
              },
            };
          }

          const currStop = bus.stops[currentIdx];
          const nextStop = bus.stops[nextIdx];

          // Move current coordinates slightly toward next stop
          const stepRatio = 0.04; // smooth nudge
          const nextPos = interpolatePosition(
            bus.currentLocation,
            { lat: nextStop.lat, lng: nextStop.lng },
            stepRatio
          );

          // Calculate remaining distance to next stop
          const distToNext = calculateDistanceKm(
            nextPos.lat,
            nextPos.lng,
            nextStop.lat,
            nextStop.lng
          );

          let newStopIndex = currentIdx;
          if (distToNext < 0.4) {
            // Reached stop! Advance to next stop
            newStopIndex = Math.min(bus.stops.length - 1, currentIdx + 1);
          }

          // Fluctuate speed realistically
          const speedDelta = (Math.random() - 0.48) * 3;
          const newSpeed = Math.max(25, Math.min(75, Math.round(bus.currentLocation.speedKmH + speedDelta)));

          return {
            ...bus,
            currentStopIndex: newStopIndex,
            currentLocation: {
              ...bus.currentLocation,
              lat: nextPos.lat,
              lng: nextPos.lng,
              speedKmH: bus.delayMinutes > 10 ? Math.min(newSpeed, 35) : newSpeed,
              lastUpdated: 'Just now',
            },
          };
        });
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Destination Stop Alarm Checker
  useEffect(() => {
    if (!activeAlarm || !activeAlarm.enabled || triggeredAlarm) return;

    const bus = allBuses.find((b) => b.id === activeAlarm.busId);
    if (!bus) return;

    const targetStopIndex = bus.stops.findIndex((s) => s.id === activeAlarm.targetStopId);
    if (targetStopIndex === -1) return;

    const targetStop = bus.stops[targetStopIndex];
    const distToTarget = calculateDistanceKm(
      bus.currentLocation.lat,
      bus.currentLocation.lng,
      targetStop.lat,
      targetStop.lng
    );
    const etaMinutes = calculateETA(distToTarget, bus.currentLocation.speedKmH, bus.delayMinutes);

    const shouldTrigger = shouldAlarmTrigger(
      bus.currentStopIndex,
      targetStopIndex,
      distToTarget,
      etaMinutes,
      activeAlarm.alertBefore
    );

    if (shouldTrigger) {
      setTriggeredAlarm(activeAlarm);
      // Play chosen sound and start alert loop
      playAlarmSound(activeAlarm.sound, activeAlarm.volume);
    }
  }, [allBuses, activeAlarm, triggeredAlarm]);

  // Sound loop when alarm is active
  useEffect(() => {
    if (!triggeredAlarm) return;
    const soundInterval = setInterval(() => {
      playAlarmSound(triggeredAlarm.sound, triggeredAlarm.volume);
    }, 2200);
    return () => clearInterval(soundInterval);
  }, [triggeredAlarm]);

  // Handler to swap cities
  const handleSwapCities = () => {
    const temp = fromCity;
    setFromCity(toCity);
    setToCity(temp);
  };

  // Handler to save alarm
  const handleSaveAlarm = (settings: StopAlarmSettings | null) => {
    setActiveAlarm(settings);
    saveAlarmSettings(settings);
  };

  // Handler to submit crowdsource report
  const handleSubmitReport = (newReport: Omit<CrowdsourceReport, 'id' | 'timestamp' | 'upvotes'>) => {
    const report: CrowdsourceReport = {
      ...newReport,
      id: `cr-${Date.now()}`,
      timestamp: 'Just now',
      upvotes: 1,
      hasUserUpvoted: true,
    };

    setAllBuses((prev) =>
      prev.map((bus) => {
        if (bus.id === newReport.busId) {
          const updatedReports = [report, ...bus.crowdsourceReports];
          return {
            ...bus,
            crowdsourceReports: updatedReports,
          };
        }
        return bus;
      })
    );

    // Save to offline storage
    saveTimetableToCache(allBuses);
    setCacheMeta(getCacheMetadata(allBuses));
  };

  // Handler to upvote report
  const handleUpvote = (reportId: string) => {
    setAllBuses((prev) =>
      prev.map((bus) => {
        const found = bus.crowdsourceReports.some((r) => r.id === reportId);
        if (!found) return bus;

        return {
          ...bus,
          crowdsourceReports: bus.crowdsourceReports.map((r) => {
            if (r.id === reportId) {
              const hasVoted = r.hasUserUpvoted;
              return {
                ...r,
                upvotes: hasVoted ? r.upvotes - 1 : r.upvotes + 1,
                hasUserUpvoted: !hasVoted,
              };
            }
            return r;
          }),
        };
      })
    );
  };

  // Handler to open alarm modal with preset stop
  const handleOpenAlarmModal = (bus?: BusRoute, stopId?: string) => {
    if (bus) {
      setSelectedBusId(bus.id);
    }
    setAlarmTargetStopPreset(stopId);
    setAlarmModalOpen(true);
  };

  // Handler to open crowdsource modal
  const handleOpenCrowdsource = (bus?: BusRoute) => {
    if (bus) {
      setSelectedBusId(bus.id);
    }
    setCrowdsourceModalOpen(true);
  };

  // Refresh cache
  const handleRefreshCache = () => {
    saveTimetableToCache(allBuses);
    setCacheMeta(getCacheMetadata(allBuses));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        lang={lang}
        onToggleLang={() => setLang((prev) => (prev === 'ta' ? 'en' : 'ta'))}
        onOpenOfflineTimetable={() => setOfflineModalOpen(true)}
        activeAlarm={activeAlarm}
        onOpenAlarmModal={() => handleOpenAlarmModal(currentBus)}
        isOfflineMode={isOfflineMode}
      />

      {/* Offline Mode Banner when testing airplane mode */}
      {isOfflineMode && (
        <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 border-b border-amber-500/40 px-4 py-2 text-center text-xs text-amber-200 flex items-center justify-center gap-2">
          <Database className="w-4 h-4 text-amber-400" />
          <span>
            <b>{lang === 'ta' ? 'ஆஃப்லைன் பயன்முறை ஆன்:' : 'Offline Mode Active:'}</b>{' '}
            {lang === 'ta'
              ? 'நெட்வொர்க் சிக்னல் இல்லாமலே ஆஃப்லைன் அட்டவணை மூலம் பஸ் விவரங்கள் இயங்குகின்றன (Where is my Train போன்றது)'
              : 'App running on local timetable cache without cellular network (Like Where is my Train)'}
          </span>
          <button
            onClick={() => setIsOfflineMode(false)}
            className="underline font-bold text-white ml-2 hover:text-amber-300"
          >
            {lang === 'ta' ? 'ஆன்லைனுக்கு திரும்பு' : 'Go Online'}
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex-1 w-full space-y-5">
        {/* Route Search Section */}
        <RouteSearch
          fromCity={fromCity}
          toCity={toCity}
          onChangeFrom={setFromCity}
          onChangeTo={setToCity}
          onSwapCities={handleSwapCities}
          selectedBusType={selectedBusType}
          onSelectBusType={setSelectedBusType}
          lang={lang}
          searchFilterText={searchFilterText}
          onChangeSearchFilterText={setSearchFilterText}
        />

        {/* Mobile View Toggle Pills */}
        <div className="flex md:hidden bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === 'map'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'நேரலை மேப் & ETA' : 'Live Map & ETA'}</span>
          </button>
          <button
            onClick={() => setMobileTab('buses')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mobileTab === 'buses'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>
              {lang === 'ta' ? 'பஸ் பட்டியல்' : 'Bus List'} ({filteredBuses.length})
            </span>
          </button>
        </div>

        {/* Main 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Search Results / Bus List (Desktop or Mobile Tab) */}
          <div
            className={`lg:col-span-5 space-y-4 ${
              mobileTab === 'buses' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{lang === 'ta' ? 'கிடைக்கும் பேருந்துகள்' : 'Available Buses'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {filteredBuses.length}
                </span>
              </h2>

              <button
                onClick={() => setOfflineModalOpen(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{lang === 'ta' ? 'முழு அட்டவணை' : 'All Timetables'}</span>
              </button>
            </div>

            <BusList
              buses={filteredBuses}
              selectedBusId={selectedBusId}
              onSelectBus={(bus) => {
                setSelectedBusId(bus.id);
                setMobileTab('map');
              }}
              onOpenAlarm={(bus, stopId) => handleOpenAlarmModal(bus, stopId)}
              onOpenCrowdsource={(bus) => handleOpenCrowdsource(bus)}
              lang={lang}
            />
          </div>

          {/* Right Column: Live Map + Next Stop ETA + Delay Alerts + Crowdsource */}
          <div
            className={`lg:col-span-7 space-y-5 ${
              mobileTab === 'map' ? 'block' : 'hidden lg:block'
            }`}
          >
            {/* Bus Header Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-emerald-600 font-mono font-bold text-white text-base rounded-xl shadow">
                  {currentBus.routeNumber}
                </div>
                <div>
                  <div className="font-bold text-white text-base">
                    {lang === 'ta' ? currentBus.fromCityTa : currentBus.fromCityEn} →{' '}
                    {lang === 'ta' ? currentBus.toCityTa : currentBus.toCityEn}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="font-mono text-slate-300">{currentBus.busNumberPlate}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{currentBus.busType}</span>
                    <span>•</span>
                    <span>{currentBus.depot}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAlarmModal(currentBus)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{lang === 'ta' ? 'அலாரம்' : 'Alarm'}</span>
                </button>

                <button
                  onClick={() => handleOpenCrowdsource(currentBus)}
                  className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <span>{lang === 'ta' ? 'தகவல் பதிவு' : 'Report'}</span>
                </button>
              </div>
            </div>

            {/* Next Stop + ETA (Fulfills prompt: “உங்க bus 8 நிமிடத்தில் Thoothukudi New Bus Stand வரும்”) */}
            <NextStopETA
              bus={currentBus}
              lang={lang}
              onOpenAlarm={(stopId) => handleOpenAlarmModal(currentBus, stopId)}
              targetAlarmStopId={
                activeAlarm?.busId === currentBus.id ? activeAlarm.targetStopId : undefined
              }
            />

            {/* Live Bus Map with Moving Bus Icon */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'ta' ? 'நேரலை பேருந்து மேப்' : 'Live Interactive Map'}</span>
                </span>
                <span className="text-xs text-slate-500">
                  {lang === 'ta' ? 'இயக்கத்தை கட்டுப்படுத்த மேலே உள்ள பட்டன்களை அழுத்தவும்' : 'Simulation active'}
                </span>
              </div>

              <LiveBusMap
                bus={currentBus}
                lang={lang}
                isSimulating={isSimulating}
                onToggleSimulation={() => setIsSimulating((prev) => !prev)}
                onSelectStop={(stopId) => handleOpenAlarmModal(currentBus, stopId)}
                targetAlarmStopId={
                  activeAlarm?.busId === currentBus.id ? activeAlarm.targetStopId : undefined
                }
              />
            </div>

            {/* Delay & Incident Alerts Banner (Fulfills prompt: Bus breakdown, traffic, “Delayed by 15 minutes”) */}
            <DelayAlertsBanner
              alerts={currentBus.delayAlerts}
              delayMinutes={currentBus.delayMinutes}
              lang={lang}
              onReportClick={() => handleOpenCrowdsource(currentBus)}
            />

            {/* Crowdsourced Status Feed (Fulfills prompt: “Bus stopped near Kovilpatti”, “AC not working”, “Heavy traffic”) */}
            <CrowdsourceFeed
              reports={currentBus.crowdsourceReports}
              lang={lang}
              onUpvote={handleUpvote}
              onOpenReportModal={() => handleOpenCrowdsource(currentBus)}
            />
          </div>
        </div>
      </main>

      {/* Stop Alarm Modal */}
      <StopAlarmModal
        bus={currentBus}
        currentAlarm={activeAlarm?.busId === currentBus.id ? activeAlarm : null}
        selectedStopId={alarmTargetStopPreset}
        lang={lang}
        isOpen={alarmModalOpen}
        onClose={() => setAlarmModalOpen(false)}
        onSaveAlarm={handleSaveAlarm}
      />

      {/* Alarm Triggered Full-Screen Wake-up Modal */}
      {triggeredAlarm && (
        <AlarmTriggeredModal
          alarm={triggeredAlarm}
          lang={lang}
          onDismiss={() => {
            setTriggeredAlarm(null);
            setActiveAlarm(null);
            saveAlarmSettings(null);
          }}
        />
      )}

      {/* Crowdsource Report Modal */}
      <CrowdsourceModal
        bus={currentBus}
        lang={lang}
        isOpen={crowdsourceModalOpen}
        onClose={() => setCrowdsourceModalOpen(false)}
        onSubmitReport={handleSubmitReport}
      />

      {/* Offline Timetable Browser Modal */}
      <OfflineTimetableModal
        isOpen={offlineModalOpen}
        onClose={() => setOfflineModalOpen(false)}
        allRoutes={allBuses}
        cacheMeta={cacheMeta}
        isOfflineMode={isOfflineMode}
        onToggleOfflineMode={() => setIsOfflineMode((prev) => !prev)}
        onRefreshCache={handleRefreshCache}
        lang={lang}
        onSelectBus={(bus) => {
          setSelectedBusId(bus.id);
          setMobileTab('map');
        }}
      />
    </div>
  );
}
