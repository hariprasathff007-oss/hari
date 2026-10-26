import React, { useState } from 'react';
import { BusRoute, StopAlarmSettings } from '../types/bus';
import { Bell, Volume2, X, Check, AlertCircle, Smartphone, Radio } from 'lucide-react';
import { playAlarmSound } from '../utils/soundEffects';

interface StopAlarmModalProps {
  bus: BusRoute;
  currentAlarm: StopAlarmSettings | null;
  selectedStopId?: string;
  lang: 'ta' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onSaveAlarm: (settings: StopAlarmSettings | null) => void;
}

export const StopAlarmModal: React.FC<StopAlarmModalProps> = ({
  bus,
  currentAlarm,
  selectedStopId,
  lang,
  isOpen,
  onClose,
  onSaveAlarm,
}) => {
  const defaultTargetStop = selectedStopId
    ? bus.stops.find((s) => s.id === selectedStopId)
    : bus.stops[bus.stops.length - 1]; // default to final destination

  const [targetStopId, setTargetStopId] = useState<string>(
    currentAlarm?.targetStopId || defaultTargetStop?.id || bus.stops[0].id
  );
  const [alertBefore, setAlertBefore] = useState<StopAlarmSettings['alertBefore']>(
    currentAlarm?.alertBefore || '1_stop'
  );
  const [sound, setSound] = useState<StopAlarmSettings['sound']>(
    currentAlarm?.sound || 'horn'
  );
  const [vibrate, setVibrate] = useState<boolean>(currentAlarm?.vibrate ?? true);
  const [isTestingSound, setIsTestingSound] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTestSound = () => {
    setIsTestingSound(true);
    playAlarmSound(sound, 0.85);
    setTimeout(() => setIsTestingSound(false), 800);
  };

  const handleSave = () => {
    const targetStop = bus.stops.find((s) => s.id === targetStopId);
    if (!targetStop) return;

    const newSettings: StopAlarmSettings = {
      enabled: true,
      busId: bus.id,
      busRouteNumber: bus.routeNumber,
      targetStopId: targetStop.id,
      targetStopNameEn: targetStop.nameEn,
      targetStopNameTa: targetStop.nameTa,
      alertBefore,
      sound,
      volume: 0.9,
      vibrate,
    };

    onSaveAlarm(newSettings);
    onClose();
  };

  const handleTurnOff = () => {
    onSaveAlarm(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 md:p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {lang === 'ta' ? 'இலக்கு ஸ்டாப் அலாரம் (Stop Alarm)' : 'Destination Stop Alarm'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'ta'
                  ? 'உங்க stop வரும்போது உங்களை எழுப்ப அலாரம் ஒலிக்கும் (Train App மாதிரி)'
                  : 'Get loud sound notification before your bus stop arrives'}
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

        {/* Target Stop Selection */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            {lang === 'ta' ? 'உங்களின் இறங்கும் நிறுத்தம் (Destination Stop)' : 'Select Your Drop-off Stop'}
          </label>
          <select
            value={targetStopId}
            onChange={(e) => setTargetStopId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          >
            {bus.stops.map((stop, index) => (
              <option key={stop.id} value={stop.id}>
                {index + 1}. {lang === 'ta' ? stop.nameTa : stop.nameEn} ({stop.distanceFromStartKm} km)
              </option>
            ))}
          </select>
        </div>

        {/* When to trigger */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            {lang === 'ta' ? 'எப்போது அலாரம் ஒலிக்க வேண்டும்?' : 'Wake Me Up When'}
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: '1_stop', labelEn: '1 Stop Before', labelTa: '1 நிறுத்தம் முன்னதாக' },
              { id: '2_stops', labelEn: '2 Stops Before', labelTa: '2 நிறுத்தங்கள் முன்னதாக' },
              { id: '5_mins', labelEn: '5 Minutes Before', labelTa: '5 நிமிடங்களுக்கு முன்' },
              { id: '2_km', labelEn: '2 km Distance Before', labelTa: '2 கி.மீ முன்னதாக' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setAlertBefore(opt.id as StopAlarmSettings['alertBefore'])}
                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                  alertBefore === opt.id
                    ? 'bg-amber-950/60 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="font-semibold">{lang === 'ta' ? opt.labelTa : opt.labelEn}</span>
                {alertBefore === opt.id && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Alarm Ringtone & Preview */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {lang === 'ta' ? 'அலாரம் ஒலி வகை' : 'Alarm Sound Tone'}
            </label>
            <button
              onClick={handleTestSound}
              disabled={isTestingSound}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isTestingSound ? 'animate-bounce' : ''}`} />
              <span>{lang === 'ta' ? 'ஒலியை சோதிக்க' : 'Test Sound'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { id: 'horn', name: lang === 'ta' ? 'பஸ் ஏர் ஹார்ன் (TN Bus Horn)' : 'TN Air Horn' },
              { id: 'chime', name: lang === 'ta' ? 'வேக்-அப் சைம் (Wake Ringtone)' : 'Loud Chime' },
              { id: 'train', name: lang === 'ta' ? 'ரயில் ஸ்டைல் சைம் (Train Chime)' : 'Train Melody' },
              { id: 'bell', name: lang === 'ta' ? 'மணி ஒலி (Station Bell)' : 'Station Bell' },
            ].map((snd) => (
              <button
                key={snd.id}
                type="button"
                onClick={() => {
                  setSound(snd.id as StopAlarmSettings['sound']);
                  playAlarmSound(snd.id as StopAlarmSettings['sound'], 0.7);
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  sound === snd.id
                    ? 'bg-amber-950/50 border-amber-500 text-amber-200'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{snd.name}</span>
                {sound === snd.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Vibration Option */}
        <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-4 h-4 text-slate-400" />
            <div>
              <div className="text-xs font-semibold text-white">
                {lang === 'ta' ? 'போன் அதிர்வு (Vibration)' : 'Device Vibration'}
              </div>
              <div className="text-[11px] text-slate-400">
                {lang === 'ta' ? 'தூங்கும் போது கூட உணர வைக்கும்' : 'Vibrates when waking up'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={vibrate}
            onChange={(e) => setVibrate(e.target.checked)}
            className="w-4 h-4 text-amber-500 rounded border-slate-700 focus:ring-amber-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center gap-3">
          {currentAlarm && currentAlarm.enabled && (
            <button
              onClick={handleTurnOff}
              className="flex-1 py-3 bg-slate-800 hover:bg-rose-950/50 hover:text-rose-300 text-slate-300 font-semibold rounded-xl text-sm border border-slate-700 transition-colors"
            >
              {lang === 'ta' ? 'அலாரத்தை ரத்து செய்' : 'Turn Off Alarm'}
            </button>
          )}

          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>{lang === 'ta' ? 'அலாரம் அமை (Set Alarm)' : 'Arm Destination Alarm'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AlarmTriggeredModal: React.FC<{
  alarm: StopAlarmSettings;
  lang: 'ta' | 'en';
  onDismiss: () => void;
}> = ({ alarm, lang, onDismiss }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-gradient-to-b from-amber-900 via-slate-900 to-slate-950 border-2 border-amber-500 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
        {/* Pulsing ring */}
        <div className="w-24 h-24 mx-auto mb-4 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/50 animate-bounce">
          <Bell className="w-12 h-12" />
        </div>

        <div className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-950 px-3 py-1 rounded-full inline-block border border-amber-700 mb-2">
          {lang === 'ta' ? 'எழுந்திருங்கள்! ஸ்டாப் வந்துவிட்டது' : 'WAKE UP! DESTINATION ARRIVED'}
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
          {lang === 'ta' ? alarm.targetStopNameTa : alarm.targetStopNameEn}
        </h2>

        <p className="text-sm text-amber-200 mt-2 font-medium">
          {lang === 'ta'
            ? 'உங்க பேருந்து உங்களின் இறங்கும் நிறுத்தத்தை நெருங்கிவிட்டது! உடமைகளை எடுத்துக் கொள்ளுங்கள்.'
            : 'Your bus is arriving at your destination stop right now. Please prepare to disembark.'}
        </p>

        <button
          onClick={onDismiss}
          className="mt-6 w-full py-3.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 text-base font-extrabold rounded-2xl shadow-xl transition-transform active:scale-95"
        >
          {lang === 'ta' ? 'நான் எழுந்துவிட்டேன் (Stop Alarm)' : "I'm Awake — Dismiss Alarm"}
        </button>
      </div>
    </div>
  );
};
