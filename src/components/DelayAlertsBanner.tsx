import React from 'react';
import { DelayAlert } from '../types/bus';
import { AlertTriangle, Clock, Wrench, ShieldAlert, Route, Info, Plus } from 'lucide-react';

interface DelayAlertsBannerProps {
  alerts: DelayAlert[];
  delayMinutes: number;
  lang: 'ta' | 'en';
  onReportClick: () => void;
}

export const DelayAlertsBanner: React.FC<DelayAlertsBannerProps> = ({
  alerts,
  delayMinutes,
  lang,
  onReportClick,
}) => {
  if (alerts.length === 0 && delayMinutes === 0) {
    return (
      <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3.5 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-xs md:text-sm font-semibold text-emerald-300">
            {lang === 'ta'
              ? 'பஸ் சரியான நேரத்தில் இயங்குகிறது (நேர தாமதம் இல்லை)'
              : 'Bus is running on time — No active delays or problems reported'}
          </span>
        </div>
        <button
          onClick={onReportClick}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? 'தகவல் பகிர' : 'Report'}</span>
        </button>
      </div>
    );
  }

  const getAlertIcon = (type: DelayAlert['type']) => {
    switch (type) {
      case 'breakdown':
        return <Wrench className="w-4 h-4 text-rose-400" />;
      case 'traffic':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'diversion':
        return <Route className="w-4 h-4 text-indigo-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Prominent Delayed Banner if bus has delay */}
      {delayMinutes > 0 && (
        <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border-2 border-amber-500/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                  {lang === 'ta' ? 'தாமத எச்சரிக்கை' : 'Delay Alert'}
                </span>
                <span className="text-xs text-amber-300/80 font-mono">
                  +{delayMinutes} {lang === 'ta' ? 'நிமிடம்' : 'mins'}
                </span>
              </div>
              <div className="text-base font-bold text-white mt-0.5">
                {lang === 'ta' ? `Delayed by ${delayMinutes} minutes (${delayMinutes} நிமிடங்கள் தாமதம்)` : `Delayed by ${delayMinutes} minutes`}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {lang === 'ta'
                  ? 'போக்குவரத்து நெரிசல் அல்லது வழித்தட பணி காரணமாக பேருந்து தாமதமாக வருகிறது.'
                  : 'Bus schedule is running behind due to traffic / route corridor delay.'}
              </p>
            </div>
          </div>

          <button
            onClick={onReportClick}
            className="self-stretch sm:self-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'பிரச்சினையை பதிவு செய்' : 'Report Issue'}</span>
          </button>
        </div>
      )}

      {/* Individual Alerts */}
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
            alert.severity === 'high'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-slate-900/90 border-slate-700/80 text-slate-300'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-lg bg-slate-800/80 shrink-0 mt-0.5">
              {getAlertIcon(alert.type)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {lang === 'ta' ? alert.titleTa : alert.titleEn}
                </span>
                <span className="text-[10px] text-slate-400">
                  • {alert.reportedAt}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {lang === 'ta' ? alert.descriptionTa : alert.descriptionEn}
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
              alert.severity === 'high'
                ? 'bg-rose-900/80 text-rose-300 border border-rose-700'
                : 'bg-amber-900/80 text-amber-300 border border-amber-700'
            }`}
          >
            {alert.type}
          </span>
        </div>
      ))}
    </div>
  );
};
