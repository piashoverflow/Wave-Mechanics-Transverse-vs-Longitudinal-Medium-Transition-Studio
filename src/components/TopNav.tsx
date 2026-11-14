import React from 'react';
import { RotateCcw, Languages, Waves } from 'lucide-react';
import { Language, ModuleId } from '../types/simulation';
import { TRANSLATIONS } from '../i18n/translations';

interface TopNavProps {
  lang: Language;
  activeModule: ModuleId;
  onSelectModule: (mod: ModuleId) => void;
  onToggleLang: () => void;
  onReset: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  lang,
  activeModule,
  onSelectModule,
  onToggleLang,
  onReset,
}) => {
  const t = TRANSLATIONS[lang];

  const tabs: { id: ModuleId; label: string }[] = [
    { id: 1, label: t.tabs.m1Short },
    { id: 2, label: t.tabs.m2Short },
    { id: 3, label: t.tabs.m3Short },
    { id: 4, label: t.tabs.m4Short },
  ];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-200 px-4 lg:px-6 py-2.5 shadow-xs">
      <div className="max-w-[1680px] mx-auto flex flex-wrap xl:flex-nowrap items-center justify-between gap-3">
        {/* Left: Studio Branding Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Waves className="w-5 h-5" />
          </div>
          <h1 className="text-sm sm:text-base font-bold text-slate-950 tracking-tight leading-snug truncate max-w-[300px] sm:max-w-[380px]">
            {t.studioTitle}
          </h1>
        </div>

        {/* Center: 3 Interactive Lab Mode Tabs (Pill Navigation) */}
        <nav
          aria-label="Lab Modules"
          className="order-3 xl:order-2 w-full xl:w-auto flex items-center gap-1 p-1 bg-sky-100/80 border border-sky-200 rounded-full overflow-x-auto"
        >
          {tabs.map((tab) => {
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectModule(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-sky-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-white/70'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Language Switcher, Reset & Institution Badge */}
        <div className="order-2 xl:order-3 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-slate-900 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Switch Language"
          >
            <Languages className="w-3.5 h-3.5 text-sky-700" />
            <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-200 bg-white hover:bg-sky-50 text-slate-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.actions.reset}</span>
          </button>

          <span className="bg-rose-50 border border-rose-300 text-rose-600 font-extrabold px-3 py-1 rounded-full text-sm whitespace-nowrap shrink-0">
            উদ্ভাস
          </span>
        </div>
      </div>
    </header>
  );
};
