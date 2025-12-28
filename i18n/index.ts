import en from './locales/en';
import zh from './locales/zh';
import ja from './locales/ja';
import ko from './locales/ko';
import fr from './locales/fr';
import de from './locales/de';
import es from './locales/es';
import ru from './locales/ru';
import it from './locales/it';
import pt from './locales/pt';

export type Language = 'en' | 'zh' | 'ja' | 'ko' | 'fr' | 'de' | 'es' | 'ru' | 'it' | 'pt';

export const languages: Record<Language, { name: string; nativeName: string; flag: string }> = {
  en: { name: 'English', nativeName: 'English', flag: '🇺🇸' },
  zh: { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  ja: { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  ko: { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  fr: { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  de: { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  es: { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  ru: { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  it: { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  pt: { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' }
};

const translations: Record<Language, any> = {
  en,
  zh,
  ja,
  ko,
  fr,
  de,
  es,
  ru,
  it,
  pt
};

// 导出支持的语言列表供外部使用
export const supportedLanguages: Language[] = ['en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'ru', 'it', 'pt'];

const LANGUAGE_STORAGE_KEY = 'game-language';

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}

export function getUserSelectedLanguage(): Language | null {
  // 获取用户手动选择的语言
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && (supportedLanguages as string[]).includes(saved)) {
      return saved as Language;
    }
  } catch (e) {
    console.warn('[i18n] 无法从 localStorage 读取语言:', e);
  }
  return null;
}

export function setLanguage(lang: Language) {
  // 保存用户手动选择的语言到 localStorage
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('[i18n] 无法保存语言到 localStorage:', e);
    }
  }
}

export function detectLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  
  // 优先检查用户手动选择的语言
  const userSelected = getUserSelectedLanguage();
  if (userSelected) {
    console.log(`[i18n] 使用用户手动选择的语言: ${userSelected}`);
    return userSelected;
  }
  
  // 如果没有用户选择，则自动检测系统语言
  // 优先检查 navigator.languages 数组（按优先级排序的语言列表）
  // 这个数组通常包含系统语言和浏览器语言设置
  const languages = navigator.languages || [navigator.language];
  
  // 遍历语言列表，找到第一个支持的语言
  for (const lang of languages) {
    const langCode = lang.toLowerCase().split('-')[0];
    // 使用更严格的检查：确保语言代码在支持的语言列表中
    if (supportedLanguages.includes(langCode as Language)) {
      const detectedLang = langCode as Language;
      console.log(`[i18n] 检测到语言: ${lang} -> ${detectedLang}`);
      return detectedLang;
    }
  }
  
  // 如果没有匹配的，尝试 navigator.language
  const browserLang = navigator.language.toLowerCase();
  const langCode = browserLang.split('-')[0];
  
  if (supportedLanguages.includes(langCode as Language)) {
    const detectedLang = langCode as Language;
    console.log(`[i18n] 使用 navigator.language: ${navigator.language} -> ${detectedLang}`);
    return detectedLang;
  }
  
  // 默认英语
  console.log(`[i18n] 未检测到支持的语言，使用默认: en (navigator.language=${navigator.language}, navigator.languages=${languages.join(', ')})`);
  return 'en';
}

