import React, { useState } from 'react';
import { CrowdsourceReport, BusRoute } from '../types/bus';
import { Users, Send, X, ThumbsUp, AlertCircle, Sparkles, MessageSquare } from 'lucide-react';

interface CrowdsourceModalProps {
  bus: BusRoute;
  lang: 'ta' | 'en';
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (report: Omit<CrowdsourceReport, 'id' | 'timestamp' | 'upvotes'>) => void;
}

export const CrowdsourceModal: React.FC<CrowdsourceModalProps> = ({
  bus,
  lang,
  isOpen,
  onClose,
  onSubmitReport,
}) => {
  const [category, setCategory] = useState<CrowdsourceReport['category']>('traffic');
  const [message, setMessage] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('Fellow Passenger');
  const [seatInfo, setSeatInfo] = useState<string>('Middle Row');
  const [selectedStop, setSelectedStop] = useState<string>(
    bus.stops[bus.currentStopIndex]?.nameEn || bus.stops[0].nameEn
  );

  if (!isOpen) return null;

  // Quick preset chips for rapid 1-tap reporting matching user request!
  const quickChips = [
    {
      cat: 'breakdown' as const,
      en: 'Bus stopped near Kovilpatti',
      ta: 'கோவில்பட்டி அருகே பஸ் நிற்கிறது',
    },
    {
      cat: 'ac_fan' as const,
      en: 'AC not working / Fan slow',
      ta: 'ஏசி வேலை செய்யவில்லை / ஃபேன் மெதுவாக சுற்றுகிறது',
    },
    {
      cat: 'traffic' as const,
      en: 'Heavy traffic on 4-lane bypass',
      ta: 'நான்கு வழிச்சாலையில் அதிக போக்குவரத்து நெரிசல்',
    },
    {
      cat: 'crowd' as const,
      en: 'Seats available, moderate crowd',
      ta: 'இருக்கைகள் காலியாக உள்ளன, கூட்டம் குறைவு',
    },
    {
      cat: 'traffic' as const,
      en: 'Delayed by 15 minutes',
      ta: '15 நிமிடங்கள் தாமதமாக இயங்குகிறது',
    },
  ];

  const handleApplyChip = (chip: typeof quickChips[0]) => {
    setCategory(chip.cat);
    setMessage(lang === 'ta' ? chip.ta : chip.en);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const stopObj = bus.stops.find((s) => s.nameEn === selectedStop) || bus.stops[0];

    onSubmitReport({
      busId: bus.id,
      author: authorName.trim() || 'Passenger',
      seatInfo: seatInfo.trim(),
      category,
      messageEn: message.trim(),
      messageTa: message.trim(),
      stopNameEn: stopObj.nameEn,
      stopNameTa: stopObj.nameTa,
    });

    setMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-5 md:p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white">
                {lang === 'ta' ? 'பயணிகள் நேரலை தகவல் (Crowdsource)' : 'Report Bus Status'}
              </h3>
              <p className="text-xs text-slate-400">
                {bus.routeNumber} ({bus.busNumberPlate})
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

        {/* Quick Click Suggestions */}
        <div className="mt-4">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            {lang === 'ta' ? 'விரைவு தகவல் தேர்வுகள் (1-Tap Select)' : 'Quick Reports (1-Tap)'}
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleApplyChip(chip)}
                className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 transition-colors text-left"
              >
                {lang === 'ta' ? chip.ta : chip.en}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {lang === 'ta' ? 'வகை (Category)' : 'Category'}
            </label>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'traffic', labelEn: 'Traffic', labelTa: 'நெரிசல்' },
                { id: 'breakdown', labelEn: 'Stopped / Breakdown', labelTa: 'பஸ் நிறுத்தம்' },
                { id: 'ac_fan', labelEn: 'AC / Fan', labelTa: 'ஏசி / ஃபேன்' },
                { id: 'crowd', labelEn: 'Crowd / Seats', labelTa: 'கூட்டம் / சீட்' },
                { id: 'diversion', labelEn: 'Diversion', labelTa: 'மாற்று வழி' },
                { id: 'general', labelEn: 'General', labelTa: 'பொதுவானது' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as CrowdsourceReport['category'])}
                  className={`py-2 px-2.5 rounded-xl border text-center font-medium transition-all ${
                    category === c.id
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  {lang === 'ta' ? c.labelTa : c.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Current Stop location */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {lang === 'ta' ? 'எந்த இடத்தின் அருகே? (Location)' : 'Near Which Stop?'}
            </label>
            <select
              value={selectedStop}
              onChange={(e) => setSelectedStop(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {bus.stops.map((s) => (
                <option key={s.id} value={s.nameEn}>
                  {lang === 'ta' ? s.nameTa : s.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Message textarea */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              {lang === 'ta' ? 'உங்கள் அறிக்கை / தகவல் (Status details)' : 'Status Details'}
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                lang === 'ta'
                  ? 'எ.கா: பஸ் கோவில்பட்டி அருகே நிற்கிறது, டயர் காற்று பார்க்கப்படுகிறது...'
                  : 'e.g., Bus stopped near Kovilpatti bypass for 5 mins...'
              }
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-3 text-xs md:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500"
            />
          </div>

          {/* Passenger details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {lang === 'ta' ? 'பெயர் (விருப்பமிருந்தால்)' : 'Your Name (Optional)'}
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                {lang === 'ta' ? 'இருக்கை எண் / பகுதி' : 'Seat / Position'}
              </label>
              <input
                type="text"
                value={seatInfo}
                onChange={(e) => setSeatInfo(e.target.value)}
                placeholder="Seat 14 / Front"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl p-2 text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>{lang === 'ta' ? 'தகவலை பதிவேற்று (Post Update)' : 'Share Status to Other Passengers'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export const CrowdsourceFeed: React.FC<{
  reports: CrowdsourceReport[];
  lang: 'ta' | 'en';
  onUpvote: (reportId: string) => void;
  onOpenReportModal: () => void;
}> = ({ reports, lang, onUpvote, onOpenReportModal }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm md:text-base">
              {lang === 'ta' ? 'பயணிகள் பகிர்ந்த நேரலை தகவல்கள்' : 'Passenger Crowdsource Live Feed'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {lang === 'ta' ? 'உண்மையான பயணிகளால் பகிரப்பட்ட நேரடி நிலவரம்' : 'Real-time updates posted by fellow commuters'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenReportModal}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-xl shadow transition-colors flex items-center gap-1.5"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{lang === 'ta' ? '+ புதிய தகவல்' : '+ Post Report'}</span>
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-xs">
          {lang === 'ta' ? 'இன்னும் பயணிகள் தகவல்கள் இல்லை. நீங்களே முதலாக பகிருங்கள்!' : 'No reports yet for this bus. Be the first to share updates!'}
        </div>
      ) : (
        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {reports.map((report) => (
            <div
              key={report.id}
              className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-xs text-white">
                      {report.author}
                    </span>
                    {report.seatInfo && (
                      <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                        {report.seatInfo}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">• {report.timestamp}</span>
                    {report.stopNameEn && (
                      <span className="text-[10px] text-emerald-400 font-medium">
                        📍 {lang === 'ta' ? report.stopNameTa : report.stopNameEn}
                      </span>
                    )}
                  </div>

                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                    {lang === 'ta' ? report.messageTa : report.messageEn}
                  </p>
                </div>

                {/* Upvote button */}
                <button
                  onClick={() => onUpvote(report.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold border transition-all ${
                    report.hasUserUpvoted
                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title={lang === 'ta' ? 'உறுதி செய் / பயனுள்ளது' : 'Confirm / Helpful'}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${report.hasUserUpvoted ? 'fill-current' : ''}`} />
                  <span className="mt-0.5 text-[11px]">{report.upvotes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
