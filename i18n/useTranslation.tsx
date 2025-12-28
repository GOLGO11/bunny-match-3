import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Language, detectLanguage, setLanguage, getTranslation, languages } from './index';

interface TranslationContextType {
  t: any;
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  availableLanguages: typeof languages;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguageState] = useState<Language>(() => {
    // 清理localStorage中可能存在的旧语言设置（不再使用手动选择）
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('game-language');
      } catch (e) {
        // 忽略错误
      }
    }
    
    const detected = detectLanguage();
    console.log(`[i18n] 初始化语言检测: ${detected} (navigator.language=${navigator.language}, navigator.languages=${navigator.languages?.join(', ')})`);
    return detected;
  });

  // 检测并更新语言
  const updateLanguage = useCallback(() => {
    const detectedLang = detectLanguage();
    console.log(`[i18n] 重新检测语言: ${detectedLang}`);
    setCurrentLanguageState(prevLang => {
      // 只有当检测到的语言与当前语言不同时才更新
      if (detectedLang !== prevLang) {
        console.log(`[i18n] 语言从 ${prevLang} 更新为 ${detectedLang}`);
        return detectedLang;
      }
      return prevLang;
    });
  }, []);

  useEffect(() => {
    setLanguage(currentLanguage);
  }, [currentLanguage]);

  // 监听系统语言变化
  useEffect(() => {
    // 监听 languagechange 事件（部分浏览器支持）
    const handleLanguageChange = () => {
      updateLanguage();
    };

    // 监听窗口焦点变化，当窗口重新获得焦点时重新检测语言
    const handleFocus = () => {
      updateLanguage();
    };

    // 监听 visibilitychange，当标签页重新可见时重新检测语言
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateLanguage();
      }
    };

    window.addEventListener('languagechange', handleLanguageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [updateLanguage]); // 依赖于 updateLanguage

  const setCurrentLanguage = (lang: Language) => {
    setCurrentLanguageState(lang);
    setLanguage(lang);
  };

  const value: TranslationContextType = {
    t: getTranslation(currentLanguage),
    currentLanguage,
    setCurrentLanguage,
    availableLanguages: languages
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}

