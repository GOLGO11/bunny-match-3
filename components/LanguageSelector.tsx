import React, { useState } from 'react';
import { useTranslation } from '../i18n/useTranslation';
import { Language } from '../i18n';

export const LanguageSelector: React.FC = () => {
  const { currentLanguage, setCurrentLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = availableLanguages[currentLanguage];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-700/80 hover:bg-slate-600/80 backdrop-blur-sm border border-slate-600 rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105"
        title="Select Language"
      >
        <span className="text-lg">{currentLang.flag}</span>
        <span className="hidden sm:inline">{currentLang.nativeName}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute bottom-full left-0 mb-2 bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-2 min-w-[200px] z-50">
            <div className="text-xs text-slate-400 px-3 py-2 mb-1">Select Language</div>
            {Object.entries(availableLanguages).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => {
                  setCurrentLanguage(code as Language);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  currentLanguage === code
                    ? 'bg-pink-500/30 text-pink-200 font-semibold'
                    : 'text-slate-300 hover:bg-slate-700/50'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1">{lang.nativeName}</span>
                {currentLanguage === code && <span className="text-pink-400">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

